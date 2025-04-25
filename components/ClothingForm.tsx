import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ClothingItem, ClothingSubType, ClothingType } from '@/types';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker from './ImagePicker';
import { fits, subtypesByType, types } from '@/constants/Clothes';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import GenericSelector from './GenericSelector';
import ColorSelector from './ColorSelector';
import { PATTERNS } from '@/constants/Clothes';
import { MATERIALS } from '@/constants/Materials';
import { BRANDS } from '@/constants/Clothes';
import { COLORS } from '@/constants/Clothes';
import Header from './Header';
import { supabase } from '@/constants/Supabase';
import { decode } from 'base64-arraybuffer';
import BrandSelector from './BrandSelector';
import { useClothing } from '@/contexts/ClothingContext';
import Toast from 'react-native-toast-message';

export type ClothingFormData = {
  name: string;
  reference?: string;
  brand?: string | null;
  type: ClothingType;
  subtype?: ClothingSubType;
  color: string | null;
  pattern?: string | null;
  material?: string | null;
  fit?: 'slim' | 'regular' | 'loose' | 'oversize';
  image_url?: string | null;
};

interface ClothingFormProps {
  initialData?: Partial<ClothingFormData>;
  onSubmit: (data: ClothingFormData, imageChanged: boolean) => Promise<void>;
  isSubmitting: boolean;
  uploadingImage: boolean;
  mode: 'add' | 'edit';
  showReferenceInfo?: boolean;
}

const ClothingForm: React.FC<ClothingFormProps> = ({
  initialData = {},
  onSubmit,
  isSubmitting,
  uploadingImage,
  mode,
  showReferenceInfo = false
}) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  // États du formulaire
  const [name, setName] = useState(initialData.name || '');
  const [reference, setReference] = useState(initialData.reference || '');
  const [brand, setBrand] = useState<string | null | undefined>(initialData.brand || null);
  const [type, setType] = useState<ClothingType>(initialData.type || 'top'); // Valeur par défaut pour éviter null
  const [subtype, setSubtype] = useState<ClothingSubType | null | undefined>(initialData.subtype || null);
  const [color, setColor] = useState<string | null>(initialData.color || null);
  const [pattern, setPattern] = useState<string | null>(initialData.pattern || 'plain');
  const [material, setMaterial] = useState<string | null | undefined>(initialData.material || null);
  const [fit, setFit] = useState<string | null | undefined>(initialData.fit || null);
  const [image, setImage] = useState<string | null>(initialData.image_url || null);
  const [imageChanged, setImageChanged] = useState(false);
  const [originalImage] = useState<string | null>(initialData.image_url || null);

  // Obtenir les sous-types pour le type sélectionné
  const availableSubtypes = type ? subtypesByType[type] || {} : {};

  // Convertir les constantes en options pour GenericSelector
  const colorOptions = COLORS.map(color => ({
    key: color.id,
    label: color.name,
  }));

  const brandOptions = BRANDS.map(brand => ({
    key: brand,
    label: brand,
  }));

  const patternOptions = Object.entries(PATTERNS).map(([key, label]) => ({
    key,
    label,
  }));

  const materialOptions = Object.entries(MATERIALS).map(([key, label]) => ({
    key,
    label,
  }));

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!name || !color || !image) {
      Toast.show({
        text1: 'Erreur',
        text2: 'Veuillez remplir tous les champs obligatoires (nom, couleur) et ajouter une image',
        type: 'error',
      });
      return;
    }

    const formData: ClothingFormData = {
      name,
      reference: reference || undefined,
      brand: brand,
      type,
      subtype: subtype || undefined,
      color,
      pattern,
      material,
      fit: fit as 'slim' | 'regular' | 'loose' | 'oversize' | undefined,
      image_url: image,
    };

    try {
      await onSubmit(formData, image !== originalImage);
    } catch (error) {
      console.error('Erreur dans le formulaire:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    }
  };

  const showReferenceInfoModal = () => {
    Alert.alert('Référence', 'La référence est un code unique qui identifie le vêtement. Si vous le communiquez, nous pourrons vous proposer une completion automatique dans le cas où nous l\'avons déjà dans notre base de données.');
  };

  return (
    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
      <Text style={[styles.label, { color: colors.text.main }]}>
        Référence 
        {showReferenceInfo && (
          <Ionicons 
            onPress={showReferenceInfoModal} 
            name="information-circle" 
            size={16} 
            color={colors.primary.main} 
          />
        )}
      </Text>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.gray,
            color: colors.text.main,
            borderColor: reference ? colors.primary.main : undefined
          }
        ]}
        placeholder="Référence (optionnel)"
        value={reference}
        onChangeText={setReference}
        placeholderTextColor={colors.text.light}
      />

      <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Image*</Text>
      <ImagePicker 
        imageUri={image}
        onImageSelected={(uri) => {
          setImage(uri);
          setImageChanged(true);
        }}
        onImageRemoved={() => {
          setImage(null);
          setImageChanged(true);
        }}
        uploading={uploadingImage}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Nom*</Text>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.gray,
            color: colors.text.main,
            borderColor: name ? colors.primary.main : undefined
          }
        ]}
        placeholder="Ex: T-shirt blanc"
        value={name}
        onChangeText={setName}
        placeholderTextColor={colors.text.light}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Type*</Text>
      <GenericSelector
        options={types}
        selectedOption={type}
        onOptionSelect={(selected) => setType(typeof selected === 'string' ? selected as ClothingType : 'top')}
        title="Sélectionner un type"
        placeholder="Sélectionner un type"
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Sous-type *</Text>
      <GenericSelector
        options={availableSubtypes}
        selectedOption={subtype || ''}
        onOptionSelect={(selected) => setSubtype(typeof selected === 'string' ? selected as ClothingSubType : null)}
        title="Sélectionner un sous-type"
        placeholder="Sélectionner un sous-type"
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Couleur*</Text>
      <ColorSelector
        selectedColor={color}
        onColorSelect={setColor}
      />

<Text style={[styles.label, { color: colors.text.main }]}>Marque</Text>
      <BrandSelector
        selectedBrand={brand || null}
        onBrandSelect={setBrand}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Motif</Text>
      <GenericSelector
        options={patternOptions}
        selectedOption={pattern}
        onOptionSelect={(selected) => setPattern(typeof selected === 'string' ? selected : null)}
        title="Sélectionner un motif"
        placeholder="Sélectionner un motif"
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Matériau</Text>
      <GenericSelector
        options={materialOptions}
        selectedOption={material || ''  }
        onOptionSelect={(selected) => setMaterial(typeof selected === 'string' ? selected : null)}
        title="Sélectionner un matériau"
        placeholder="Sélectionner un matériau"
        searchable={true}
        searchPlaceholder="Rechercher un matériau..."
      />

      <Text style={[styles.label, { color: colors.text.main }]}>Coupe</Text>
      <GenericSelector
        options={fits}
        selectedOption={fit || ''}
        onOptionSelect={(selected) => setFit(typeof selected === 'string' ? selected : null)}
        title="Sélectionner une coupe"
        placeholder="Sélectionner une coupe"
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: colors.primary.main },
          (isSubmitting || !name || !color || !image) && { opacity: 0.7 }
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting || !name || !color || !image}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.text.bright} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.text.bright }]}>
            {mode === 'add' ? 'Ajouter' : 'Enregistrer'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 5,
  },
  picker: {
    height: 54,
  },
  saveButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
});

type ClothingFormWrapperProps = {
  initialData?: Partial<ClothingFormData>;
  mode: 'add' | 'edit';
  clothingId?: string;
  title: string;
};

const ClothingFormWrapper: React.FC<ClothingFormWrapperProps> = ({ 
  initialData = {},
  mode, 
  clothingId,
  title
}) => {
  const { user } = useAuth();
  const { updateClothing: updateClothingInContext, setRefreshing } = useClothing();
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

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
      
      if (mode === 'add') {
        // Insérer dans la base de données
        const { error, data: newClothing } = await supabase
          .from('clothes')
          .insert([{
            user_id: user.id,
            name: formData.name,
            reference: formData.reference,
            brand: formData.brand,
            type: formData.type || 'top', // Valeur par défaut pour éviter null
            subtype: formData.subtype,
            color: formData.color || '',
            pattern: formData.pattern || 'plain', // Valeur par défaut pour éviter null
            material: formData.material,
            fit: formData.fit,
            image_url: imageUrl || '',
          }]);
          
        if (error) {
          throw error;
        }
        if(newClothing) {
          Toast.show({
            text1: 'Vêtement ajouté avec succès!',
            type: 'success',
          });
          router.push(`/clothing/${(newClothing as any).id}`);
        }
      } else if (mode === 'edit' && clothingId) {
        // Préparer l'objet de mise à jour compatible avec ClothingItem
        const updatedClothing = {
          name: formData.name,
          reference: formData.reference,
          brand: formData.brand === null ? undefined : formData.brand,
          type: formData.type || 'top', 
          subtype: formData.subtype,
          color: formData.color || '',
          pattern: formData.pattern === null ? undefined : formData.pattern,
          material: formData.material === null ? undefined : formData.material,
          fit: formData.fit,
          image_url: imageUrl || '',
        };
        
        // Mettre à jour dans la base de données
        const { error } = await supabase
          .from('clothes')
          .update(updatedClothing)
          .eq('id', clothingId)
          .eq('user_id', user.id);
          
        if (error) {
          throw error;
        }
        
        // Mettre à jour l'état local via le contexte
        updateClothingInContext(clothingId, updatedClothing as any);
        
        setRefreshing(true);
        Toast.show({
          text1: 'Vêtement mis à jour avec succès!',
          type: 'success',
        });
        router.back();
      }
    } catch (error) {
      console.error('Erreur lors de l\'opération sur le vêtement:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le vêtement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      setRefreshing(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <ClothingForm 
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
        uploadingImage={uploadingImage}
        mode={mode}
        showReferenceInfo={mode === 'add'}
      />
    </SafeAreaView>
  );
};

export { ClothingForm };
export default ClothingFormWrapper; 