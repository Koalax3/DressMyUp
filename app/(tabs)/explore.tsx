import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Outfit, User } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import OutfitPreview from '../../components/OutfitPreview';

// Type simplifié pour l'affichage des tenues
type OutfitWithUser = Outfit & { user: User };

export default function ExploreScreen() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<OutfitWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOutfits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('outfits')
        .select(`
          *,
          user:user_id (*)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des tenues:', error);
      } else {
        setOutfits(data as OutfitWithUser[] || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Utiliser useFocusEffect pour recharger les données quand l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      fetchOutfits();
    }, [user])
  );

  // Effet pour le chargement initial
  useEffect(() => {
    fetchOutfits();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOutfits();
  };

  const handleLike = async (outfitId: string) => {
    if (!user) return;

    try {
      // Vérifier si l'utilisateur a déjà aimé cette tenue
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('outfit_id', outfitId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification du like:', checkError);
        return;
      }

      if (existingLike) {
        // Supprimer le like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {
          console.error('Erreur lors de la suppression du like:', deleteError);
          return;
        }

        // Mettre à jour le compteur de likes
        await supabase.rpc('decrement_likes', { outfit_id: outfitId });
      } else {
        // Ajouter un like
        const { error: insertError } = await supabase
          .from('likes')
          .insert([
            {
              user_id: user.id,
              outfit_id: outfitId,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Erreur lors de l\'ajout du like:', insertError);
          return;
        }

        // Mettre à jour le compteur de likes
        await supabase.rpc('increment_likes', { outfit_id: outfitId });
      }

      // Rafraîchir les tenues
      fetchOutfits();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const renderOutfitItem = ({ item }: { item: OutfitWithUser }) => (
    <OutfitPreview outfit={item} onLike={handleLike} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <View style={styles.separator} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : outfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Aucune tenue trouvée</Text>
          <Text style={styles.emptySubtext}>
            Soyez le premier à partager une tenue !
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/create')}
          >
            <Text style={styles.createButtonText}>Créer une tenue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={outfits}
          renderItem={renderOutfitItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
  },
  list: {
    padding: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 