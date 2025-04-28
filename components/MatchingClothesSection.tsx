import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { ClothingItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/constants/Supabase';
import ClotheView, { MatchType } from './ClotheView';
import { Ionicons } from '@expo/vector-icons';
import { isDressMatch, isSimilarMatch, isPerfectMatch } from '@/services/matchingService';
import LargeButton from './LargeButton';
import { router } from 'expo-router';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import { useClothing } from '@/contexts/ClothingContext';
import { useTheme } from '@/contexts/ThemeContext';

type MatchingClothesSectionProps = {
  currentItem: ClothingItem;
};

const MatchingClothesSection = ({ currentItem }: MatchingClothesSectionProps) => {
  const { user } = useAuth();
  const { setClothingToCopy } = useClothing();
  const [loading, setLoading] = useState(true);
  const { clothes } = useClothing();
  const [perfectMatches, setPerfectMatches] = useState<ClothingItem[]>([]);
  const [dressMatches, setDressMatches] = useState<ClothingItem[]>([]);
  const [similarMatches, setSimilarMatches] = useState<ClothingItem[]>([]);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [currentItem, user, clothes]);

  const fetchWardrobeItems = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      
      const perfect: ClothingItem[] = [];
      const dress: ClothingItem[] = [];
      const similar: ClothingItem[] = [];
      
      for (const item of clothes) {
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
        onPress={() => {
          setClothingToCopy(currentItem);
          router.push('/clothing/add');
        }}
      />
    )
  }

  return (
    <View style={styles.container}>
      <Text style={{...styles.sectionTitle, color: colors.text.light}}>Dress Match<Ionicons onPress={() => Alert.alert('Dress Match', 'Dress Match compare le vêtement consulté avec les vêtements de ta garde-robe et ressort ceux qui ont des caractéristiques similaires.')} name="information-circle" size={16} style={{marginLeft: 10}} color={colors.primary.main} /></Text>
      {dressMatches.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchTitleContainer}>
            <Image source={require('@/assets/images/dress-match.png')} style={styles.dressMatchImage} />
            <Text style={{...styles.matchTitle, color: colors.text.main}}>Correspondances parfaites</Text>
          </View>
          <FlatList
            data={dressMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
                userWardrobeItems={[currentItem, ...clothes]}
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
            <Ionicons name="checkmark-circle" size={20} color={colors.match.main} />
            <Text style={{...styles.matchTitle, color: colors.text.main}}>Fortes correspondances</Text>
          </View>
          <FlatList
            data={perfectMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
                userWardrobeItems={[currentItem, ...clothes]}
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
            <Ionicons name="alert-circle" size={20} color={colors.similar.main} />
            <Text style={{...styles.matchTitle, color: colors.text.main}}>Vêtements similaires</Text>
          </View>
          <FlatList
            data={similarMatches}
            renderItem={({ item }) => (
              <ClotheView 
                clothingItem={item} 
                showMatchStatus={true}
                userWardrobeItems={[currentItem, ...clothes]}
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