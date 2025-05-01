import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '@/components/Header';
import { ClothingFormData } from '@/components/ClothingForm';
import ClothingFormWrapper from '@/components/ClothingForm';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { createClothing, uploadClothingImage } from '@/services/clothingService';
import { useClothing } from '@/contexts/ClothingContext';
import { useTranslation } from '@/i18n/useTranslation';

export default function AddClothingScreen() {
  const { user } = useAuth();
  const { clothingToCopy, setClothingToCopy } = useClothing();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  
  const [initialData, setInitialData] = useState<Partial<ClothingFormData>>({});
  console.log(initialData);
  useEffect(() => {
    if (clothingToCopy) {
      // Formatage des données pour correspondre au type ClothingFormData
      setInitialData({
        name: clothingToCopy.name || '',
        reference: clothingToCopy.reference || undefined,
        brand: clothingToCopy.brand || undefined,
        type: clothingToCopy.type || 'top',
        subtype: clothingToCopy.subtype || undefined,
        color: clothingToCopy.color || null,
        pattern: clothingToCopy.pattern || 'plain',
        material: clothingToCopy.material || undefined,
        fit: clothingToCopy.fit || undefined,
        image_url: clothingToCopy.image_url || undefined,
      });
      // Réinitialiser le vêtement à copier après l'avoir utilisé
      setClothingToCopy(null);
    }
  }, [clothingToCopy]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title={t('clothing.add')} back />
      <ClothingFormWrapper 
        initialData={initialData}
        mode="add"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 