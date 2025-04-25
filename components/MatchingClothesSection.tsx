import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Image } from 'react-native';
import { ClothingItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/constants/Supabase';
import ClotheView, { MatchType } from './ClotheView';
import { Ionicons } from '@expo/vector-icons';
import { isDressMatch, isSimilarMatch, isPerfectMatch } from '@/services/matchingService';
import LargeButton from './LargeButton';
import { router } from 'expo-router';
import { ColorsTheme } from '@/constants/Colors';

type MatchingClothesSectionProps = {
  currentItem: ClothingItem;
};

const MatchingClothesSection = ({ currentItem }: MatchingClothesSectionProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [perfectMatches, setPerfectMatches] = useState<ClothingItem[]>([]);
  const [dressMatches, setDressMatches] = useState<ClothingItem[]>([]);
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
        .eq('subtype', currentItem.subtype)
        .neq('id', currentItem.id);
        
      if (error) throw error;
      const items = data as ClothingItem[];
      setWardrobeItems(items);
      
      const perfect: ClothingItem[] = [];
      const dress: ClothingItem[] = [];
      const similar: ClothingItem[] = [];
      
      for (const item of items) {
        const dressMatch = isDressMatch(item, currentItem);
        const perfectMatch = isPerfectMatch(item, currentItem);
        const similarMatch = isSimilarMatch(item, currentItem);

         if (dressMatch) {
          dress.push(item);
        } else if (perfectMatch) {
          perfect.push(item);
        } else if (similarMatch) {
          similar.push(item);
        }
      }
      
      setPerfectMatches(perfect);
      setDressMatches(dress);
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


  if (perfectMatches.length === 0 && similarMatches.length === 0 && dressMatches.length === 0) {
    if (user && user.id === currentItem.user_id) return null;
    return (
      <LargeButton
        icon="shirt"
        color={ColorsTheme.background.main}
        title="Ajouter à ma garde-robe"
        onPress={() => router.push({
          pathname: '/clothing/add',
          params: { selectItem: currentItem.id }
        })}
      />
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dress Match</Text>
      {dressMatches.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchTitleContainer}>
            <Image source={require('@/assets/images/dress-match.png')} style={styles.dressMatchImage} />
            <Text style={styles.matchTitle}>Correspondances parfaites</Text>
          </View>
          <FlatList
            data={dressMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
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

      {perfectMatches.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchTitleContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.matchTitle}>Fortes correspondances</Text>
          </View>
          <FlatList
            data={perfectMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
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
  dressMatchImage: {
    width: 20,
    height: 20,
    objectFit: 'contain',
  },
});

export default MatchingClothesSection; 