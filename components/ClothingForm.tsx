import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, View, Modal, Image } from 'react-native';
import { ClothingSubType, ClothingType, ClothingItem } from '@/types';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker from './ImagePicker';
import { fits, subtypesByType, types } from '@/constants/Clothes';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import GenericSelector from './selector/GenericSelector';
import ColorSelector from './selector/ColorSelector';
import { PATTERNS } from '@/constants/Clothes';
import { MATERIALS } from '@/constants/Materials';
import { BRANDS } from '@/constants/Clothes';
import { COLORS } from '@/constants/Clothes';
import { supabase } from '@/constants/Supabase';
import { decode } from 'base64-arraybuffer';
import BrandSelector from './selector/BrandSelector';
import { useClothing } from '@/contexts/ClothingContext';
import Toast from 'react-native-toast-message';
import { ClothingService } from '@/services';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import Accordion from './Accordion';

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
  external_link?: string | null;
  vinted_link?: string | null;
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
  const [type, setType] = useState<ClothingType>(initialData.type || 'top');
  const [subtype, setSubtype] = useState<ClothingSubType | null | undefined>(initialData.subtype || null);
  const [color, setColor] = useState<string | null>(initialData.color || null);
  const [pattern, setPattern] = useState<string | null>(initialData.pattern || 'plain');
  const [material, setMaterial] = useState<string | null | undefined>(initialData.material || null);
  const [fit, setFit] = useState<string | null | undefined>(initialData.fit || null);
  const [image, setImage] = useState<string | null>(initialData.image_url || null);
  const [imageChanged, setImageChanged] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(initialData.image_url || null);
  const [isCheckingReference, setIsCheckingReference] = useState(false);
  const [foundItem, setFoundItem] = useState<ClothingItem | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [externalLink, setExternalLink] = useState<string | null | undefined>(initialData.external_link || null);
  const [vintedLink, setVintedLink] = useState<string | null | undefined>(initialData.vinted_link || null);
  const { t } = useTranslation();
  // Fonction de vérification de référence avec debounce
  const checkReference = useCallback(
    debounce(async (ref: string) => {
      if (!ref) {
        setFoundItem(null);
        return;
      }
      setIsCheckingReference(true);
      try {
        const existingItem = await ClothingService.searchClothingByReference(ref);
        if (existingItem) {
          setFoundItem(existingItem);
          setShowSuggestionModal(true);
        } else {
          setFoundItem(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la référence:', error);
      } finally {
        setIsCheckingReference(false);
      }
    }, 500),
    []
  );

  const handleAutoComplete = () => {
    if (foundItem) {
      setImage(foundItem.image_url || null);
      setOriginalImage(foundItem.image_url || null);
      setName(foundItem.name);
      setBrand(foundItem.brand || null);
      setType(foundItem.type);
      setSubtype(foundItem.subtype || null);
      setColor(foundItem.color);
      setPattern(foundItem.pattern || 'plain');
      setMaterial(foundItem.material || null);
      setFit(foundItem.fit || null);
      setShowSuggestionModal(false);
    }
  };

  // Mettre à jour les états quand initialData change
  useEffect(() => {
    setName(initialData.name || '');
    setReference(initialData.reference || '');
    setBrand(initialData.brand || null);
    setType(initialData.type || 'top');
    setSubtype(initialData.subtype || null);
    setColor(initialData.color || null);
    setPattern(initialData.pattern || 'plain');
    setMaterial(initialData.material || null);
    setFit(initialData.fit || null);
    setImage(initialData.image_url || null);
    setOriginalImage(initialData.image_url || null);
    setExternalLink(initialData.external_link || null);
    setVintedLink(initialData.vinted_link || null);
    setImageChanged(false);
  }, [initialData]);

  // Vérifier la référence quand elle change
  useEffect(() => {
    checkReference(reference);
  }, [reference, checkReference]);

  // Obtenir les sous-types pour le type sélectionné
  const availableSubtypes = type ? subtypesByType[type] || {} : {};

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
        text1: t('errors.error'),
        text2: t('errors.requiredField'),
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
      external_link: externalLink || null,
      vinted_link: vintedLink || null,
    };

    try {
      await onSubmit(formData, image !== originalImage);
    } catch (error) {
      console.error('Erreur dans le formulaire:', error);
      Alert.alert(t('errors.error'), t('errors.tryAgain'));
    }
  };

  const showReferenceInfoModal = () => {
    Alert.alert(t('clothing.referenceLabel'), t('clothing.referenceInfo'));
  };

  return (
    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
      <Text style={[styles.label, { color: colors.text.main }]}>
        {t('clothing.referenceLabel')} 
        {showReferenceInfo && (
          <Ionicons 
            onPress={showReferenceInfoModal} 
            name="information-circle" 
            size={16} 
            color={colors.primary.main} 
          />
        )}
      </Text>
      <View style={styles.referenceContainer}>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.gray,
              color: colors.text.main,
              borderColor: reference ? colors.primary.main : undefined,
              flex: 1
            }
          ]}
          placeholder={t('clothing.referencePlaceholder')}
          value={reference}
          onChangeText={setReference}
          placeholderTextColor={colors.text.light}
        />
        {isCheckingReference && (
          <ActivityIndicator size="small" color={colors.primary.main} style={styles.checkingIndicator} />
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('clothing.image')}*</Text>
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

      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.name')}*</Text>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.gray,
            color: colors.text.main,
            borderColor: name ? colors.primary.main : undefined
          }
        ]}
        placeholder={t('clothing.namePlaceholder')}
        value={name}
        onChangeText={setName}
        placeholderTextColor={colors.text.light}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.typeLabel')}*</Text>
      <GenericSelector
        options={types}
        selectedOption={type}
        onOptionSelect={(selected) => setType(typeof selected === 'string' ? selected as ClothingType : 'top')}
        title={t('clothing.selectType')}
        placeholder={t('clothing.selectType')}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.subtypeLabel')} *</Text>
      <GenericSelector
        options={availableSubtypes}
        selectedOption={subtype || ''}
        onOptionSelect={(selected) => setSubtype(typeof selected === 'string' ? selected as ClothingSubType : null)}
        title={t('clothing.selectSubtype')}
        placeholder={t('clothing.selectSubtype')}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.colorLabel')}*</Text>
      <ColorSelector
        selectedColor={color}
        onColorSelect={setColor}
      />

      <Accordion title={t('clothing.details')} colors={colors}>
      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.brand')}</Text>
      <BrandSelector
        selectedBrand={brand || null}
        onBrandSelect={setBrand}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.patternLabel')}</Text>
      <GenericSelector
        options={patternOptions}
        selectedOption={pattern}
        onOptionSelect={(selected) => setPattern(typeof selected === 'string' ? selected : null)}
        title={t('clothing.selectPattern')}
        placeholder={t('clothing.selectPattern')}
      />

      <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.materialLabel')}</Text>
      <GenericSelector
        options={materialOptions}
        selectedOption={material || ''  }
        onOptionSelect={(selected) => setMaterial(typeof selected === 'string' ? selected : null)}
        title={t('clothing.selectMaterial')}
        placeholder={t('clothing.selectMaterial')}
        searchable={true}
        searchPlaceholder={t('clothing.searchMaterial')}
      />

      {type !== 'accessory' && type !== 'shoes' && (
        <View>
          <Text style={[styles.label, { color: colors.text.main }]}>{t('clothing.fitLabel')}</Text>
          <GenericSelector
            options={fits}
            selectedOption={fit || ''}
            onOptionSelect={(selected) => setFit(typeof selected === 'string' ? selected : null)}
            title={t('clothing.selectFit')}
            placeholder={t('clothing.selectFit')}
          />
      </View>)}
      </Accordion>

      {/* Accordéon pour les liens */}
      <Accordion title={t('clothing.links')} colors={colors}>
        <Text style={[styles.label, { color: colors.text.main }]}>
          {t('clothing.addExternalLink')}
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.gray,
              color: colors.text.main,
              borderColor: externalLink ? colors.primary.main : undefined
            }
          ]}
          placeholder={t('clothing.externalLinkPlaceholder')}
          value={externalLink || ''}
          onChangeText={setExternalLink}
          placeholderTextColor={colors.text.light}
          autoCapitalize="none"
          keyboardType="url"
        />
        
        <Text style={[styles.label, { color: colors.text.main, marginTop: 15 }]}>
          {t('clothing.addVintedLink')}
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.gray,
              color: colors.text.main,
              borderColor: vintedLink ? colors.primary.main : undefined
            }
          ]}
          placeholder={t('clothing.vintedLinkPlaceholder')}
          value={vintedLink || ''}
          onChangeText={setVintedLink}
          placeholderTextColor={colors.text.light}
          autoCapitalize="none"
          keyboardType="url"
        />
      </Accordion>

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
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.white }]}>
            {mode === 'add' ? t('clothing.add') : t('common.save')}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showSuggestionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSuggestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.main }]}>
            <Text style={[styles.modalTitle, { color: colors.text.main }]}>{t('clothing.productFound')}</Text>
            {foundItem && (
              <>
                <Image source={{ uri: foundItem.image_url }} style={styles.modalImage} />
                <Text style={[styles.modalText, { color: colors.text.main }]}>{foundItem.name}</Text>
                <Text style={[styles.modalText, { color: colors.text.light }]}>
                  {t(`clothingTypes.${foundItem.type}`)} - {foundItem.subtype && t(`clothingSubtypes.${foundItem.type}.${foundItem.subtype}`)}
                </Text>
                {foundItem.brand && (
                  <Text style={[styles.modalText, { color: colors.text.light }]}>{foundItem.brand}</Text>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.gray }]}
                    onPress={() => setShowSuggestionModal(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.text.main }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.primary.main }]}
                    onPress={handleAutoComplete}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.white }]}>{t('clothing.complete')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkingIndicator: {
    position: 'absolute',
    right: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accordionContent: {
    marginVertical: 10,
  },
});

type ClothingFormWrapperProps = {
  initialData?: Partial<ClothingFormData>;
  mode: 'add' | 'edit';
  clothingId?: string;
};

const ClothingFormWrapper: React.FC<ClothingFormWrapperProps> = ({ 
  initialData = {},
  mode, 
  clothingId,
}) => {
  const { user } = useAuth();
  const { updateClothing: updateClothingInContext, setRefreshing, addClothing } = useClothing();
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

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
        const newClothing = await ClothingService.createClothing(user.id, {
          name: formData.name,
          reference: formData.reference,
          brand: formData.brand || undefined,
          type: formData.type,
          subtype: formData.subtype,
          color: formData.color || '',
          pattern: formData.pattern || 'plain',
          material: formData.material || undefined,
          fit: formData.fit,
          image_url: imageUrl || '',
          external_link: formData.external_link || undefined,
          vinted_link: formData.vinted_link || undefined,
        });
          
        if(newClothing) {
          addClothing(newClothing);
          Toast.show({
            text1: t('success.clothingAdded'),
            type: 'success',
          });
          router.back();
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
          external_link: formData.external_link === null ? undefined : formData.external_link,
          vinted_link: formData.vinted_link === null ? undefined : formData.vinted_link,
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
          text1: t('success.clothingUpdated'),
          type: 'success',
        });
        router.back();
      }
    } catch (error) {
      console.error('Erreur lors de l\'opération sur le vêtement:', error);
      Alert.alert(t('errors.error'), t('errors.clothingSaveError'));
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