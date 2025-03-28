import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useScroll } from '@/contexts/ScrollContext';
import { ClothingItem, Outfit, User } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import OutfitPreview from '@/components/OutfitPreview';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { fetchOutfitsForExplore } from '@/services/outfitService';
import { fetchUserClothes } from '@/services/clothingService';

// Type simplifié pour l'affichage des tenues
type OutfitWithUser = Outfit & { user: User } & { clothes: ClothingItem[] };

export default function ExploreScreen() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<OutfitWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { scrollY } = useScroll();
  const [clothesUser, setClothesUser] = useState<ClothingItem[]>([]);

  useEffect(() => {
    const fetchClothesUser = async () => {
      if (!user) return;
      const clothes = await fetchUserClothes(user.id, []);
      setClothesUser(clothes);
    };
    fetchClothesUser();
  }, [user]);
  const fetchOutfits = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await fetchOutfitsForExplore(user.id);
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

  const renderOutfitItem = ({ item }: { item: OutfitWithUser }) => (
    <OutfitPreview outfit={item} userWardrobe={clothesUser} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={'Explorer'} >
       {/* <Button icon="search-outline" onPress={() => router.push('/(tabs)/create')} type="secondary" /> */}
      </Header>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97A5C" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97A5C']} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
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
    backgroundColor: '#F97A5C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#F97A5C',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 100,
  },
}); 