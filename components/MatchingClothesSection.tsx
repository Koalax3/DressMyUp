import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { ClothingItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/constants/Supabase';
import ClotheView, { MatchType } from './ClotheView';
import { Ionicons } from '@expo/vector-icons';

type MatchingClothesSectionProps = {
  currentItem: ClothingItem;
};

const MatchingClothesSection = ({ currentItem }: MatchingClothesSectionProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [perfectMatches, setPerfectMatches] = useState<ClothingItem[]>([]);
  const [similarMatches, setSimilarMatches] = useState<ClothingItem[]>([]);

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [currentItem, user]);

  const fetchWardrobeItems = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user.id)
        .neq('id', currentItem.id);
        
      if (error) throw error;
      
      const items = data as ClothingItem[];
      setWardrobeItems(items);
      
      // Trouver les correspondances parfaites et similaires
      const perfect: ClothingItem[] = [];
      const similar: ClothingItem[] = [];
      
      for (const item of items) {
        // Vérifier les correspondances parfaites
        const isPerfectMatch = 
          item.color === currentItem.color &&
          item.subtype === currentItem.subtype &&
          (item.material === currentItem.material) &&
          (item.pattern === currentItem.pattern) &&
          (item.brand === currentItem.brand);
        
        // Vérifier les correspondances similaires (au moins couleur, subtype et matière)
        const isSimilarMatch = 
          item.color === currentItem.color &&
          item.subtype === currentItem.subtype &&
          (item.material === currentItem.material) ||
          (item.brand === currentItem.brand);
        
        if (isPerfectMatch) {
          perfect.push(item);
        } else if (isSimilarMatch) {
          similar.push(item);
        }
      }
      
      setPerfectMatches(perfect);
      setSimilarMatches(similar);
    } catch (error) {
      console.error("Erreur lors de la récupération des vêtements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#F97A5C" />
      </View>
    );
  }

  if (perfectMatches.length === 0 && similarMatches.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Match Dress</Text>
      
      {perfectMatches.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchTitleContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.matchTitle}>Correspondances parfaites</Text>
          </View>
          <FlatList
            data={perfectMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
                showMatchStatus={true}
                userWardrobeItems={[currentItem, ...wardrobeItems]}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal={false}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            style={styles.matchList}
          />
        </View>
      )}
      
      {similarMatches.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchTitleContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF9800" />
            <Text style={styles.matchTitle}>Vêtements similaires</Text>
          </View>
          <FlatList
            data={similarMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
                showMatchStatus={true}
                userWardrobeItems={[currentItem, ...wardrobeItems]}
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal={false}
            scrollEnabled={false}
            nestedScrollEnabled={false}
            style={styles.matchList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 30,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  matchSection: {
    marginBottom: 20,
  },
  matchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#444',
  },
  matchList: {
    marginTop: 5,
  },
});

export default MatchingClothesSection; 