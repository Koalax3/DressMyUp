import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClothing } from '../../contexts/ClothingContext';
import { useOutfit } from '@/contexts/OutfitContext';
import { ClothingItem, ClothingSubType, ClothingType, Outfit } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import ImagePicker from '../../components/ImagePicker';
import * as OutfitService from '../../services/outfitService';
import * as StorageService from '../../services/storageService';
import { occasions } from '@/constants/Outfits';
import GenderSelector from '@/components/selector/GenderSelector';
import { associateClothesToOutfit } from '@/services/clotheOutfitsService';
import { MatchType } from '@/components/ClotheView';
import DraggableClothingList from '@/components/DraggableClothingList';
import EmptyWardrobeModal from '@/components/EmptyWardrobeModal';
import GenericSelector from '@/components/selector/GenericSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import SeasonSelector from '@/components/selector/SeasonSelector';
import Header from '@/components/Header';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/i18n/useTranslation';

// Type pour les vêtements avec position
type ClothingWithPosition = ClothingItem & { position?: number };
type Season = 'all' | 'spring' | 'summer' | 'fall' | 'winter';

export default function CreateOutfitScreen() {
  const { user } = useAuth();
  const { clothes: clothesFromContext, isLoading: isLoadingClothes, refreshClothes, hasClothes } = useClothing();
  const { clothescreateOutfit, setClothescreateOutfit } = useOutfit();
  const params = useLocalSearchParams();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState<Season>('all');
  const [occasion, setOccasion] = useState<string | null>(null);
  const [gender, setGender] = useState('unisex');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmptyWardrobeModal, setShowEmptyWardrobeModal] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  // Utiliser les vêtements du contexte
  useEffect(() => {
    if (clothesFromContext.length > 0) {
      setLoading(false);
      setShowEmptyWardrobeModal(false);
    } else if (!isLoadingClothes) {
      // Si le contexte est vide et qu'il n'est pas en train de charger, on tente de rafraîchir les données
      refreshClothes();
      // Afficher le modal si aucun vêtement n'est disponible après le chargement
    }
  }, [clothesFromContext, isLoadingClothes, loading]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        if (clothesFromContext.length === 0 && !isLoadingClothes) {
          refreshClothes();
        }
        if (!hasClothes && !showEmptyWardrobeModal) {
          setShowEmptyWardrobeModal(true);
        }
        if (params.selectItem) {
          const newClothes = [...clothescreateOutfit];
          if (!newClothes.find(item => item.id === params.selectItem)) {
            const selectedItem = clothesFromContext.find(item => item.id === params.selectItem);
            if (selectedItem) {
              newClothes.push({ ...selectedItem, position: newClothes.length });
              setClothescreateOutfit(newClothes);
            }
          }
        }
        
        if (params.selectedClothes && params.returnFromSelect === 'true') {
          const selectedIds = (params.selectedClothes as string).split(',').filter(id => id !== '');
          const newClothes = selectedIds.map((id, index) => {
            const clotheItem = clothesFromContext.find(c => c.id === id);
            return clotheItem ? { ...clotheItem, position: index } : null;
          }).filter(Boolean) as ClothingWithPosition[];
          
          setClothescreateOutfit(newClothes);
          
          if (params.formName) setName(params.formName as string);
          if (params.formDescription) setDescription(params.formDescription as string);
          if (params.formSeason) setSeason(params.formSeason as Season);
          if (params.formOccasion) setOccasion(params.formOccasion as string);
          if (params.formGender) setGender(params.formGender as string);
          if (params.formImage && params.formImage !== '') setOutfitImage(params.formImage as string);
        }
      }
    }, [user, params.selectItem, params.selectedClothes, params.returnFromSelect, params.formName, params.formDescription, params.formSeason, params.formOccasion, params.formGender, params.formImage, clothesFromContext, isLoadingClothes])
  );

  const navigateToSelectClothes = () => {
    router.push({
      pathname: '/wardrobe/select',
      params: {
        mode: 'create',
        formName: name,
        formDescription: description,
        formSeason: season,
        formOccasion: occasion,
        formImage: outfitImage || '',
        enableMatching: 'true'
      }
    });
  };

  // Fonction pour télécharger l'image vers Supabase
  const uploadImage = async (): Promise<string | null> => {
    if (!outfitImage || !user) return null;
    
    try {
      setUploadingImage(true);
      
      // Utiliser directement uploadOutfitImage
      const imageUrl = await StorageService.uploadOutfitImage(user.id, outfitImage);
      
      if (!imageUrl) {
        console.error('Erreur: l\'image n\'a pas pu être téléchargée');
      }
      
      return imageUrl || null;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const saveOutfit = async () => {
    if (!user) return;
    
    if (!name || clothescreateOutfit.length === 0) {
      Alert.alert(t('errors.generic'), t('errors.requiredField'));
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | undefined = undefined;
      if (outfitImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const outfitData = {
        name,
        description: description || undefined,
        image_url: imageUrl,
        season,
        occasion,
        gender,
      };

      const newOutfit = await OutfitService.createOutfit(user.id, outfitData);

      if (!newOutfit) {
        Alert.alert(t('errors.generic'), t('outfit.loadDetailError'));
        return;
      }

      const outfitId = newOutfit.id;

      const clothingIds = clothescreateOutfit
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(item => item.id);

      const success = await associateClothesToOutfit(
        outfitId,
        clothingIds
      );

      if (!success) {
        console.error(t('errors.unexpectedError'));
      }

      Toast.show({
        text1: t('success.saved'),
        type: 'success'
      });
      setName('');
      setDescription('');
      setClothescreateOutfit([]);
      setOutfitImage(null);
      router.replace({
        pathname: '/outfit/[id]',
        params: { id: outfitId }
      });
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('errors.generic'), t('errors.tryAgain'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title={t('outfits.createOutfit')} />

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          {/* Section pour l'image de la tenue */}
          <Text style={[styles.sectionTitle, { marginTop: 20, color: colors.text.main }]}>{t('outfit.image')}</Text>
          <ImagePicker 
            imageUri={outfitImage}
            onImageSelected={(uri) => setOutfitImage(uri)}
            onImageRemoved={() => setOutfitImage(null)}
            uploading={uploadingImage}
          />
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('common.information')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.gray,
              color: colors.text.main
            }]}
            placeholder={t('outfit.nameRequired')}
            placeholderTextColor={colors.text.light}
            value={name}
            onChangeText={setName}
          />
          
          {/* Description de la tenue */}
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('outfit.description')}</Text>
          <TextInput
            style={[
              styles.input, 
              styles.textArea,
              { 
                backgroundColor: colors.gray,
                color: colors.text.main
              }
            ]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder={t('outfit.descriptionOptional')}
            placeholderTextColor={colors.text.light}
          />

          {/* Saison */}
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('clothing.season')}</Text>
          <SeasonSelector 
            selectedSeason={season} 
            onSelectSeason={setSeason} 
          />

          {/* Occasion */}
          <View style={styles.occasionSelector}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('explore.style')}</Text>
            <GenericSelector
              options={occasions}
              selectedOption={occasion}
              onOptionSelect={(value) => setOccasion(value as string)}
              title={t('outfit.selectStyle')}
              placeholder={t('outfit.chooseStyle')}
            />
          </View>

          {/* Genre */}
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('explore.gender')}</Text>
          <GenderSelector 
            selectedGender={gender}
            onGenderChange={setGender}
          />
        </View>

        {/* Vêtements sélectionnés */}
        {clothescreateOutfit.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('outfit.selectedClothes')}</Text>
            <Text style={[styles.helperText, { color: colors.text.light }]}>{t('outfit.dragToReorder')}</Text>
            <View style={styles.draggableListContainer}>
              <DraggableClothingList />
            </View>
          </View>
        )}

        <View style={styles.wardrobeButtonContainer}>
          <TouchableOpacity 
            style={[styles.wardrobeButton, { backgroundColor: colors.secondary.main }]}
            onPress={navigateToSelectClothes}
          >
            <Ionicons name="shirt-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={[styles.wardrobeButtonText, { color: colors.white }]}>
              {clothescreateOutfit.length > 0 ? t('outfit.modifySelection') : t('outfit.chooseClothes')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary.main }]}
          onPress={saveOutfit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.text.bright} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.white }]}>{t('outfits.createOutfit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <EmptyWardrobeModal 
        visible={showEmptyWardrobeModal}
        onClose={() => setShowEmptyWardrobeModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectedSection: {
    marginBottom: 20,
  },
  emptySelection: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    marginBottom: 10,
  },
  selectedClothesContainer: {
    paddingVertical: 10,
    marginBottom: 15,
  },
  selectedClothingItem: {
    marginRight: 15,
    position: 'relative',
  },
  selectedClothingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  wardrobeButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  wardrobeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seasonSelector: {
    marginBottom: 10,
  },
  occasionSelector: {
    marginBottom: 10,
  },
  wardrobeButtonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  draggableListContainer: {
    marginBottom: 20,
  },
}); 