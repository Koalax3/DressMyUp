import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useClothing } from '@/contexts/ClothingContext';
import { ClothingItem } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import ClothingFormWrapper, { ClothingFormData } from '@/components/ClothingForm';
import Header from '@/components/Header';

export default function EditClothingScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { loadClothing } = useClothing();
  const [loading, setLoading] = useState(true);
  const [clothingData, setClothingData] = useState<Partial<ClothingFormData>>({});
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    const fetchClothingData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const clothingItem = await loadClothing(id.toString());
        
        if (clothingItem) {
          setClothingData({
            name: clothingItem.name,
            reference: clothingItem.reference,
            brand: clothingItem.brand,
            type: clothingItem.type,
            subtype: clothingItem.subtype,
            color: clothingItem.color,
            pattern: clothingItem.pattern,
            material: clothingItem.material,
            fit: clothingItem.fit,
            image_url: clothingItem.image_url
          });
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClothingData();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.main }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title="Modifier le vêtement" back />
      <ClothingFormWrapper 
        initialData={clothingData}
        mode="edit"
        clothingId={id?.toString()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 