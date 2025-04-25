import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Header from '@/components/Header';
import { supabase } from '@/constants/Supabase';
import { ClothingFormData } from '@/components/ClothingForm';
import ClothingForm from '@/components/ClothingForm';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { decode } from 'base64-arraybuffer';

export default function AddClothingScreen() {
  const { user } = useAuth();
  const { id: idToCopy } = useLocalSearchParams<{ id: string }>();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [initialData, setInitialData] = useState<Partial<ClothingFormData>>({});

  useEffect(() => {
    if (idToCopy) {
      loadClothingToCopy();
    }
  }, [idToCopy]);

  const loadClothingToCopy = async () => {
    if (!idToCopy) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clothing')
        .select('*')
        .eq('id', idToCopy)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setInitialData({
          name: data.name,
          reference: data.reference,
          brand: data.brand,
          type: data.type,
          subtype: data.subtype,
          color: data.color,
          pattern: data.pattern,
          material: data.material,
          fit: data.fit,
          // Ne pas copier l'image pour éviter les doublons
          image_url: null, 
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: ClothingFormData, imageChanged: boolean) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      let imageUrl = formData.image_url;
      
      // Si l'image a été changée, on doit la traiter
      if (imageChanged && imageUrl) {
        setUploadingImage(true);
        
        // Gérer l'upload de l'image
        const fileExt = imageUrl.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        // Extraire les données de l'image (format base64 à partir de data:image/xyz;base64,)
        const imgBase64 = imageUrl.split(',')[1];
        
        const { error: uploadError } = await supabase.storage
          .from('clothing_images')
          .upload(filePath, decode(imgBase64), {
            contentType: `image/${fileExt}`,
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('clothing_images')
          .getPublicUrl(filePath);
          
        imageUrl = data.publicUrl;
        setUploadingImage(false);
      }
      
      // Insérer dans la base de données
      const { error } = await supabase
        .from('clothing')
        .insert([{
          user_id: user.id,
          name: formData.name,
          reference: formData.reference,
          brand: formData.brand,
          type: formData.type,
          subtype: formData.subtype,
          color: formData.color,
          pattern: formData.pattern,
          material: formData.material,
          fit: formData.fit,
          image_url: imageUrl,
        }]);
        
      if (error) {
        throw error;
      }
      
      Alert.alert('Succès', 'Vêtement ajouté avec succès!', [
        { text: 'OK', onPress: () => router.push('/clothing' as any) }
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du vêtement:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le vêtement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour décoder une chaîne en base64
  function decode(str: string): Uint8Array {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title="Ajouter un vêtement" back />
      <ClothingForm 
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
        uploadingImage={uploadingImage}
        mode="add"
        showReferenceInfo={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 