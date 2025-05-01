import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOutfit } from '@/contexts/OutfitContext';
import { ClothingItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import ImagePicker from '@/components/ImagePicker';
import * as OutfitService from '@/services/outfitService';
import * as StorageService from '@/services/storageService';
import * as ClothingService from '@/services/clothingService';
import { occasions } from '@/constants/Outfits';
import GenderSelector from '@/components/selector/GenderSelector';
import DraggableClothingList from '@/components/DraggableClothingList';
import { updateClothesPositions } from '@/services/clotheOutfitsService';
import GenericSelector from '@/components/selector/GenericSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import SeasonSelector from '@/components/selector/SeasonSelector';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/i18n/useTranslation';

// Type pour les vêtements avec position
type ClothingWithPosition = ClothingItem & { position?: number };
type Season = 'all' | 'spring' | 'summer' | 'fall' | 'winter';

export default function EditOutfitScreen() {
  const { user } = useAuth();
  const { clothescreateOutfit, setClothescreateOutfit } = useOutfit();
  const params = useLocalSearchParams();
  const outfitId = params.id as string;
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState<Season>('all');
  const [occasion, setOccasion] = useState('casual');
  const [isPublic, setIsPublic] = useState(true);
  const [gender, setGender] = useState('unisex');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [initialOutfitImage, setInitialOutfitImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (outfitId && user) {
      fetchOutfitDetails();
      fetchClothes();
    }
    return () => {
      setClothescreateOutfit([]);
    };
  }, [outfitId, user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        if (params.selectItem) {
          const newClothes = [...clothescreateOutfit];
          if (!newClothes.find(item => item.id === params.selectItem)) {
            const selectedItem = clothes.find(item => item.id === params.selectItem);
            if (selectedItem) {
              newClothes.push({ ...selectedItem, position: newClothes.length });
              console.log(newClothes);
              setClothescreateOutfit(newClothes);
            }
          }
        }
        
        if (params.selectedClothes && params.returnFromSelect === 'true') {
          const selectedIds = (params.selectedClothes as string).split(',').filter(id => id !== '');
          const newClothes = selectedIds.map((id, index) => {
            const clotheItem = clothes.find(c => c.id === id);
            return clotheItem ? { ...clotheItem, position: index } : null;
          }).filter(Boolean) as ClothingWithPosition[];
          
          setClothescreateOutfit(newClothes);
          
          if (params.formName) setName(params.formName as string);
          if (params.formDescription) setDescription(params.formDescription as string);
          if (params.formSeason) setSeason(params.formSeason as Season);
          if (params.formOccasion) setOccasion(params.formOccasion as string);
          if (params.formIsPublic) setIsPublic(params.formIsPublic === 'true');
          if (params.formGender) setGender(params.formGender as string);
          if (params.formImage && params.formImage !== '') setOutfitImage(params.formImage as string);
        }
      }
    }, [user, params.selectItem, params.selectedClothes, params.returnFromSelect, params.formName, 
        params.formDescription, params.formSeason, params.formOccasion, params.formImage, 
        params.formIsPublic, params.formGender, clothes])
  );

  const fetchOutfitDetails = async () => {
    try {
      setLoading(true);
      const outfitDetails = await OutfitService.fetchOutfitDetails(outfitId);
      
      if (!outfitDetails || outfitDetails.user_id !== user?.id) {
        Toast.show({
          type: 'error',
          text1: t('errors.permissionDenied')
        });
        router.back();
        return;
      }

      setName(outfitDetails.name);
      setDescription(outfitDetails.description || '');
      setSeason((outfitDetails.season || 'all') as Season);
      setOccasion(outfitDetails.occasion || 'casual');
      setIsPublic(outfitDetails.isPublic !== false);
      setGender(outfitDetails.gender || 'unisex');
      
      if (outfitDetails.image_url) {
        setOutfitImage(outfitDetails.image_url);
        setInitialOutfitImage(outfitDetails.image_url);
      }
      
      if (outfitDetails.clothes) {
        const sortedClothes = [...outfitDetails.clothes].sort((a: any, b: any) => {
          const posA = a.position !== undefined ? a.position : 999;
          const posB = b.position !== undefined ? b.position : 999;
          return posA - posB;
        });
        
        const clothesWithPositions = sortedClothes.map((item: any, index: number) => {
          const clotheItem = item.clothe || item;
          return {
            ...clotheItem,
            position: index
          };
        });
        
        setClothescreateOutfit(clothesWithPositions);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la tenue:', error);
      Toast.show({
        type: 'error',
        text1: t('outfit.loadDetailError')
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClothes = async () => {
    if (!user) return;

    try {
      const clothesData = await ClothingService.fetchUserClothes(user.id);
      setClothes(clothesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des vêtements:', error);
      Toast.show({
        type: 'error',
        text1: t('wardrobe.loadError')
      });
    }
  };

  const navigateToWardrobeSelect = () => {
    router.push({
      pathname: '/wardrobe/select' as any,
      params: { 
        selectedIds: clothescreateOutfit.map(item => item.id).join(','),
        formName: name,
        formDescription: description,
        formSeason: season,
        formOccasion: occasion,
        formIsPublic: isPublic.toString(),
        formGender: gender,
        formImage: outfitImage || '',
      }
    });
  };

  // Fonction pour télécharger l'image vers Supabase
  const uploadImage = async (): Promise<string | null> => {
    if (!outfitImage || !user) return null;
    
    // Si l'image n'a pas changé, on retourne simplement l'URL existante
    if (outfitImage === initialOutfitImage) {
      return outfitImage;
    }
    
    try {
      setUploadingImage(true);
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

  const updateOutfit = async () => {
    if (!user || !outfitId) return;
    
    if (!name || clothescreateOutfit.length === 0) {
      Toast.show({
        type: 'error',
        text1: t('errors.requiredField')
      });
      return;
    }

    setSaving(true);

    try {
      // Étape 1: Télécharger l'image si elle a été modifiée
      let imageUrl: string | undefined = undefined;
      if (outfitImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Étape 2: Mettre à jour la tenue
      const outfitData: any = {
        name,
        description: description || undefined,
        season,
        occasion,
        isPublic,
        gender
      };
      
      // N'ajouter l'image que si elle a été modifiée
      if (outfitImage !== initialOutfitImage) {
        outfitData.image_url = imageUrl;
      }

      const success = await OutfitService.updateOutfit(outfitId, outfitData);

      if (!success) {
        Toast.show({
          type: 'error',
          text1: t('outfit.loadDetailError')
        });
        return;
      }

      // Étape 3: Mettre à jour les vêtements associés avec leurs positions
      // On trie les vêtements selon leurs positions dans clothescreateOutfit
      const sortedClothingIds = clothescreateOutfit
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(item => item.id);

      const clothesSuccess = await OutfitService.updateOutfitClothes(
        outfitId,
        sortedClothingIds
      );

      if (!clothesSuccess) {
        console.error(t('errors.unexpectedError'));
      }

      // Mettre à jour les positions
      const positionsToUpdate = clothescreateOutfit.map(item => ({
        clotheId: item.id,
        position: item.position || 0
      }));
      
      await updateClothesPositions(outfitId, positionsToUpdate);

      Toast.show({
        type: 'success',
        text1: t('success.updated')
      });
      
      router.back();
    } catch (error) {
      console.error('Erreur:', error);
      Toast.show({
        type: 'error',
        text1: t('errors.tryAgain')
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={{ marginTop: 10, color: colors.text.main }}>{t('outfit.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? colors.background.dark : '#f0f0f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.main} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.main }]}>{t('outfits.editOutfit')}</Text>
        <View style={{ width: 24 }} />
      </View>

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
              backgroundColor: isDarkMode ? colors.background.deep : '#f5f5f5',
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
                backgroundColor: isDarkMode ? colors.background.deep : '#f5f5f5',
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
          <View style={{ marginBottom: 20 }}>
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>{t('outfit.clothes')}</Text>
          <View style={styles.draggableListContainer}>
            <DraggableClothingList/>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.wardrobeButton,
            { backgroundColor: colors.secondary.main }
          ]}
          onPress={navigateToWardrobeSelect}
        >
          <Ionicons name="shirt-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.wardrobeButtonText}>
            {clothescreateOutfit.length > 0 ? t('outfit.modifySelection') : t('outfit.chooseClothes')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary.main },
            saving && { opacity: 0.7 }
          ]}
          onPress={updateOutfit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('outfits.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginBottom: 20,
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  visibilityButtonActive: {
    borderWidth: 0,
  },
  visibilityButtonText: {
    marginLeft: 5,
    fontSize: 16,
  },
  visibilityButtonTextActive: {
    fontWeight: 'bold',
  },
  draggableListContainer: {
    marginBottom: 20,
  },
  wardrobeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  wardrobeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 