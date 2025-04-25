import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useClothing } from '../../contexts/ClothingContext';
import { ClothingItem, ClothingSubType, ClothingType, Outfit } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import ImagePicker from '../../components/ImagePicker';
import { decode } from 'base64-arraybuffer';
import * as OutfitService from '../../services/outfitService';
import * as StorageService from '../../services/storageService';
import * as ClothingService from '../../services/clothingService';
import { occasions } from '@/constants/Outfits';
import { subtypesByType } from '@/constants/Clothes';
import GenderSelector from '@/components/GenderSelector';
import { associateClothesToOutfit } from '@/services/clotheOutfitsService';
import ClotheView from '@/components/ClotheView';
import { MatchType } from '@/components/ClotheView';
import DraggableClothingList from '@/components/DraggableClothingList';
import EmptyWardrobeModal from '@/components/EmptyWardrobeModal';
import GenericSelector from '@/components/GenericSelector';
import { ColorsTheme } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import SeasonSelector from '@/components/SeasonSelector';

// Type pour les vêtements avec position
type ClothingWithPosition = ClothingItem & { position?: number };
type Season = 'all' | 'spring' | 'summer' | 'fall' | 'winter';

export default function CreateOutfitScreen() {
  const { user } = useAuth();
  const { clothes: clothesFromContext, isLoading: isLoadingClothes, refreshClothes, hasClothes } = useClothing();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState<Season>('all');
  const [occasion, setOccasion] = useState<string | null>(null);
  const [gender, setGender] = useState('unisex');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [selectedClothesIds, setSelectedClothesIds] = useState<string[]>([]);
  const [selectedClothesWithPositions, setSelectedClothesWithPositions] = useState<ClothingWithPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchType>(MatchType.NONE);
  const [showEmptyWardrobeModal, setShowEmptyWardrobeModal] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  // Utiliser les vêtements du contexte
  useEffect(() => {
    if (clothesFromContext.length > 0) {
      setClothes(clothesFromContext);
      setLoading(false);
      setShowEmptyWardrobeModal(false);
    } else if (!isLoadingClothes) {
      // Si le contexte est vide et qu'il n'est pas en train de charger, on tente de rafraîchir les données
      refreshClothes();
      // Afficher le modal si aucun vêtement n'est disponible après le chargement
    }
  }, [clothesFromContext, isLoadingClothes, loading]);

  // Mettre à jour selectedClothesWithPositions quand selectedClothesIds ou clothes changent
  useEffect(() => {
    if (selectedClothesIds.length > 0 && clothes.length > 0) {
      const clothesWithPositions = selectedClothesIds.map((id, index) => {
        const clotheItem = clothes.find(c => c.id === id);
        return clotheItem ? { ...clotheItem, position: index } : null;
      }).filter(Boolean) as ClothingWithPosition[];
      
      setSelectedClothesWithPositions(clothesWithPositions);
    } else {
      setSelectedClothesWithPositions([]);
    }
  }, [selectedClothesIds, clothes]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        // Rafraîchir les vêtements depuis le contexte si nécessaire
        if (clothesFromContext.length === 0 && !isLoadingClothes) {
          refreshClothes();
        }
        if (!hasClothes && !showEmptyWardrobeModal) {
          setShowEmptyWardrobeModal(true);
        }
        // Ajouter un vêtement spécifique à la sélection
        if (params.selectItem) {
          setSelectedClothesIds(prev => 
            prev.includes(params.selectItem as string) 
              ? prev 
              : [...prev, params.selectItem as string]
          );
        }
        
        // Récupérer les vêtements sélectionnés depuis l'écran de sélection
        if (params.selectedClothes && params.returnFromSelect === 'true') {
          // Récupérer les vêtements sélectionnés
          const selectedIds = (params.selectedClothes as string).split(',').filter(id => id !== '');
          setSelectedClothesIds(selectedIds);
          
          // Récupérer les autres informations du formulaire
          if (params.formName) setName(params.formName as string);
          if (params.formDescription) setDescription(params.formDescription as string);
          if (params.formSeason) setSeason(params.formSeason as string);
          if (params.formOccasion) setOccasion(params.formOccasion as string);
          if (params.formGender) setGender(params.formGender as string);
          if (params.formImage && params.formImage !== '') setOutfitImage(params.formImage as string);
        } else if (params.selectedClothes && !params.returnFromSelect) {
          // Si on revient pour la première fois de l'écran de sélection, on récupère seulement les vêtements
          const selectedIds = (params.selectedClothes as string).split(',').filter(id => id !== '');
          setSelectedClothesIds(selectedIds);
        }
      }
    }, [user, params.selectItem, params.selectedClothes, params.returnFromSelect, params.formName, params.formDescription, params.formSeason, params.formOccasion, params.formGender, params.formImage, clothesFromContext, isLoadingClothes])
  );

  const navigateToSelectClothes = () => {
    // Sauvegarder l'état du formulaire avant la navigation
    router.push({
      pathname: '/wardrobe/select',
      params: { 
        formName: name,
        formDescription: description,
        formSeason: season,
        formOccasion: occasion,
        formImage: outfitImage || '',
        enableMatching: 'true' // Activer la fonctionnalité de matching
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
    
    if (!name || selectedClothesIds.length === 0) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre tenue et sélectionner au moins un vêtement');
      return;
    }

    setSaving(true);

    try {
      // Étape 1: Télécharger l'image si elle existe
      let imageUrl: string | undefined = undefined;
      if (outfitImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Étape 2: Créer la tenue
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
        Alert.alert('Erreur', 'Impossible de créer la tenue. Veuillez réessayer.');
        return;
      }

      const outfitId = newOutfit.id;

      // Étape 3: Associer les vêtements à la tenue avec leurs positions
      // On trie les vêtements selon leurs positions dans selectedClothesWithPositions
      const clothingIdsWithPositions = selectedClothesWithPositions.map(item => ({
        id: item.id,
        position: item.position || 0
      }));
      
      // On trie les ids par position
      const sortedClothingIds = clothingIdsWithPositions
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map(item => item.id);

      const success = await associateClothesToOutfit(
        outfitId,
        sortedClothingIds
      );

      if (!success) {
        console.error('Erreur lors de l\'association des vêtements à la tenue');
      }

      Alert.alert(
        'Succès',
        'Tenue créée avec succès!',
        [{ text: 'OK', onPress: () => {
          setName('');
          setDescription('');
          setSelectedClothesIds([]);
          setSelectedClothesWithPositions([]);
          setOutfitImage(null);
          router.replace({
            pathname: '/outfit/[id]',
            params: { id: outfitId }
          });
        }}]
      );
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={[styles.header, { borderBottomColor: colors.text.lighter }]}>
        <Text style={[styles.title, { color: colors.text.main }]}>Créer une tenue</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          {/* Section pour l'image de la tenue */}
          <Text style={[styles.sectionTitle, { marginTop: 20, color: colors.text.main }]}>Image de la tenue</Text>
          <ImagePicker 
            imageUri={outfitImage}
            onImageSelected={(uri) => setOutfitImage(uri)}
            onImageRemoved={() => setOutfitImage(null)}
            uploading={uploadingImage}
          />
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Informations</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.gray,
              color: colors.text.main
            }]}
            placeholder="Nom de la tenue*"
            placeholderTextColor={colors.text.light}
            value={name}
            onChangeText={setName}
          />
          
          {/* Description de la tenue */}
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Description</Text>
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
            placeholder="Décrivez votre tenue (optionnel)"
            placeholderTextColor={colors.text.light}
          />

          {/* Saison */}
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Saison</Text>
          <SeasonSelector 
            selectedSeason={season} 
            onSelectSeason={setSeason} 
          />

          {/* Occasion */}
          <View style={styles.occasionSelector}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Style</Text>
            <GenericSelector
              options={occasions}
              selectedOption={occasion}
              onOptionSelect={(value) => setOccasion(value as string)}
              title="Sélectionner un style"
              placeholder="Choisir un style"
            />
          </View>

          {/* Genre */}
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Genre</Text>
          <GenderSelector 
            selectedGender={gender}
            onGenderChange={setGender}
          />
        </View>

        {/* Vêtements sélectionnés */}
        {selectedClothesWithPositions.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Vêtements sélectionnés</Text>
            <Text style={[styles.helperText, { color: colors.text.light }]}>Maintenez et faites glisser pour réorganiser</Text>
            <View style={styles.draggableListContainer}>
              <DraggableClothingList 
                items={selectedClothesWithPositions} 
                onDragEnd={(data) => {
                  setSelectedClothesWithPositions(data);
                  setSelectedClothesIds(data.map(item => item.id));
                }}
                onRemoveItem={(id) => {
                  setSelectedClothesWithPositions(prev => prev.filter(item => item.id !== id));
                  setSelectedClothesIds(prev => prev.filter(itemId => itemId !== id));
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.wardrobeButtonContainer}>
          <TouchableOpacity 
            style={[styles.wardrobeButton, { backgroundColor: colors.secondary.main }]}
            onPress={navigateToSelectClothes}
          >
            <Ionicons name="shirt-outline" size={20} color={colors.text.bright} style={{ marginRight: 8 }} />
            <Text style={[styles.wardrobeButtonText, { color: colors.white }]}>
              {selectedClothesIds.length > 0 ? "Modifier la sélection" : "Choisir des vêtements"}
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
            <Text style={[styles.saveButtonText, { color: colors.white }]}>Créer la tenue</Text>
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