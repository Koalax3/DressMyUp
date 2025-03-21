import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClothingItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WardrobeScreen() {
  const { user } = useAuth();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchClothes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter) {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des vêtements:', error);
      } else {
        setClothes(data || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchClothes();
    }, [user, filter])
  );

  useEffect(() => {
    fetchClothes();
  }, [user, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClothes();
  };

  const renderClothingItem = ({ item }: { item: ClothingItem }) => (
    <TouchableOpacity 
      style={styles.clothingItem}
      onPress={() => router.push(`/clothing/${item.id}`)}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.clothingImage}
        resizeMode="cover"
      />
      <View style={styles.clothingInfo}>
        <Text style={styles.clothingName}>{item.name}</Text>
        <Text style={styles.clothingBrand}>{item.brand || 'Sans marque'}</Text>
        <View style={styles.tagContainer}>
          <View style={[styles.tag, { backgroundColor: '#FFE0E0' }]}>
            <Text style={styles.tagText}>{item.type}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#E0F0FF' }]}>
            <Text style={styles.tagText}>{item.season}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value }: { title: string; value: string | null }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Garde-robe</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/clothing/add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton title="Tous" value={null} />
        <FilterButton title="Hauts" value="top" />
        <FilterButton title="Bas" value="bottom" />
        <FilterButton title="Chaussures" value="shoes" />
        <FilterButton title="Accessoires" value="accessory" />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : clothes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Votre garde-robe est vide</Text>
          <Text style={styles.emptySubtext}>
            Commencez à ajouter vos vêtements en appuyant sur le bouton +
          </Text>
          <TouchableOpacity 
            style={styles.addEmptyButton}
            onPress={() => router.push('/clothing/add')}
          >
            <Text style={styles.addEmptyButtonText}>Ajouter un vêtement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clothes}
          renderItem={renderClothingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 15,
  },
  clothingItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clothingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  clothingInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  clothingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clothingBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
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
  addEmptyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addEmptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 