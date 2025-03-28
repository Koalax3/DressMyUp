import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ClothingItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import ImagePicker from '@/components/ImagePicker';
import * as OutfitService from '@/services/outfitService';
import * as StorageService from '@/services/storageService';
import * as ClothingService from '@/services/clothingService';
import { occasions } from '@/constants/Outfits';
import GenderSelector from '@/components/GenderSelector';

export default function EditOutfitScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const outfitId = params.id as string;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('all');
  const [occasion, setOccasion] = useState('casual');
  const [isPublic, setIsPublic] = useState(true);
  const [gender, setGender] = useState('unisex');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
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
  }, [outfitId, user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        // Ajouter un vêtement spécifique à la sélection
        if (params.selectItem) {
          setSelectedClothes(prev => 
            prev.includes(params.selectItem as string) 
              ? prev 
              : [...prev, params.selectItem as string]
          );
        }
        
        // Récupérer les vêtements sélectionnés depuis l'écran de sélection
        if (params.selectedClothes && params.returnFromSelect === 'true') {
          // Récupérer les vêtements sélectionnés
          const selectedIds = (params.selectedClothes as string).split(',').filter(id => id !== '');
          setSelectedClothes(selectedIds);
          
          // Récupérer les autres informations du formulaire
          if (params.formName) setName(params.formName as string);
          if (params.formDescription) setDescription(params.formDescription as string);
          if (params.formSeason) setSeason(params.formSeason as string);
          if (params.formOccasion) setOccasion(params.formOccasion as string);
          if (params.formIsPublic) setIsPublic(params.formIsPublic === 'true');
          if (params.formGender) setGender(params.formGender as string);
          if (params.formImage && params.formImage !== '') setOutfitImage(params.formImage as string);
        }
      }
    }, [user, params.selectItem, params.selectedClothes, params.returnFromSelect, params.formName, 
        params.formDescription, params.formSeason, params.formOccasion, params.formImage, 
        params.formIsPublic, params.formGender])
  );

  const fetchOutfitDetails = async () => {
    try {
      setLoading(true);
      const outfitDetails = await OutfitService.fetchOutfitDetails(outfitId);
      
      if (!outfitDetails || outfitDetails.user_id !== user?.id) {
        Alert.alert("Erreur", "Vous n'êtes pas autorisé à modifier cette tenue");
        router.back();
        return;
      }

      // Remplir le formulaire avec les données existantes
      setName(outfitDetails.name);
      setDescription(outfitDetails.description || '');
      setSeason(outfitDetails.season || 'all');
      setOccasion(outfitDetails.occasion || 'casual');
      setIsPublic(outfitDetails.isPublic !== false);
      setGender(outfitDetails.gender || 'unisex');
      
      if (outfitDetails.image_url) {
        setOutfitImage(outfitDetails.image_url);
        setInitialOutfitImage(outfitDetails.image_url);
      }
      
      // Récupérer les vêtements associés
      if (outfitDetails.clothes) {
        const clothingIds = outfitDetails.clothes.map(item => item.id);
        setSelectedClothes(clothingIds);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la tenue:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la tenue');
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
      Alert.alert('Erreur', 'Impossible de charger vos vêtements');
    }
  };

  const navigateToWardrobeSelect = () => {
    router.push({
      pathname: '/wardrobe/select' as any,
      params: { 
        selectedIds: selectedClothes.join(','),
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
    
    if (!name || selectedClothes.length === 0) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre tenue et sélectionner au moins un vêtement');
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
        Alert.alert('Erreur', 'Impossible de mettre à jour la tenue. Veuillez réessayer.');
        return;
      }

      // Étape 3: Mettre à jour les vêtements associés
      const clothesSuccess = await OutfitService.updateOutfitClothes(
        outfitId,
        selectedClothes
      );

      if (!clothesSuccess) {
        console.error('Erreur lors de la mise à jour des vêtements associés à la tenue');
      }

      Alert.alert(
        'Succès',
        'Tenue mise à jour avec succès!',
        [{ text: 'OK', onPress: () => {
          router.push({
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

  const selectedClothesItems = clothes.filter(item => selectedClothes.includes(item.id));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97A5C" />
          <Text style={{ marginTop: 10 }}>Chargement de la tenue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier la tenue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          {/* Section pour l'image de la tenue */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Image de la tenue</Text>
          <ImagePicker 
            imageUri={outfitImage}
            onImageSelected={(uri) => setOutfitImage(uri)}
            onImageRemoved={() => setOutfitImage(null)}
            uploading={uploadingImage}
          />
          <Text style={styles.sectionTitle}>Informations</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom de la tenue*"
            value={name}
            onChangeText={setName}
          />
          
          {/* Description de la tenue */}
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre tenue (optionnel)"
          />

          {/* Saison */}
          <Text style={styles.sectionTitle}>Saison</Text>
          <View style={styles.seasonContainer}>
            <TouchableOpacity
              style={[styles.seasonButton, season === 'all' && styles.seasonButtonActive]}
              onPress={() => setSeason('all')}
            >
              <Ionicons name="calendar-outline" size={18} color={season === 'all' ? "#fff" : "#666"} />
              <Text style={[styles.seasonButtonText, season === 'all' && styles.seasonButtonTextActive]}>Toutes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seasonButton, season === 'spring' && styles.seasonButtonActive]}
              onPress={() => setSeason('spring')}
            >
              <Ionicons name="flower-outline" size={18} color={season === 'spring' ? "#fff" : "#666"} />
              <Text style={[styles.seasonButtonText, season === 'spring' && styles.seasonButtonTextActive]}>Printemps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seasonButton, season === 'summer' && styles.seasonButtonActive]}
              onPress={() => setSeason('summer')}
            >
              <Ionicons name="sunny-outline" size={18} color={season === 'summer' ? "#fff" : "#666"} />
              <Text style={[styles.seasonButtonText, season === 'summer' && styles.seasonButtonTextActive]}>Été</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seasonButton, season === 'fall' && styles.seasonButtonActive]}
              onPress={() => setSeason('fall')}
            >
              <Ionicons name="leaf-outline" size={18} color={season === 'fall' ? "#fff" : "#666"} />
              <Text style={[styles.seasonButtonText, season === 'fall' && styles.seasonButtonTextActive]}>Automne</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seasonButton, season === 'winter' && styles.seasonButtonActive]}
              onPress={() => setSeason('winter')}
            >
              <Ionicons name="snow-outline" size={18} color={season === 'winter' ? "#fff" : "#666"} />
              <Text style={[styles.seasonButtonText, season === 'winter' && styles.seasonButtonTextActive]}>Hiver</Text>
            </TouchableOpacity>
          </View>

          {/* Occasion */}
          <Text style={styles.sectionTitle}>Occasion</Text>
          <View style={styles.occasionContainer}>
            {Object.entries(occasions).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[styles.occasionButton, occasion === key && styles.occasionButtonActive]}
                onPress={() => setOccasion(key)}
              >
                <Text style={[styles.occasionButtonText, occasion === key && styles.occasionButtonTextActive]}>{value}</Text> 
              </TouchableOpacity>
            ))}
          </View>

          {/* Visibilité */}
          <Text style={styles.sectionTitle}>Visibilité</Text>
          <View style={styles.visibilityContainer}>
            <TouchableOpacity
              style={[styles.visibilityButton, isPublic && styles.visibilityButtonActive]}
              onPress={() => setIsPublic(true)}
            >
              <Ionicons name="eye-outline" size={18} color={isPublic ? "#fff" : "#666"} />
              <Text style={[styles.visibilityButtonText, isPublic && styles.visibilityButtonTextActive]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.visibilityButton, !isPublic && styles.visibilityButtonActive]}
              onPress={() => setIsPublic(false)}
            >
              <Ionicons name="eye-off-outline" size={18} color={!isPublic ? "#fff" : "#666"} />
              <Text style={[styles.visibilityButtonText, !isPublic && styles.visibilityButtonTextActive]}>Privé</Text>
            </TouchableOpacity>
          </View>

          {/* Genre */}
          <Text style={styles.sectionTitle}>Genre</Text>
          <GenderSelector 
            selectedGender={gender}
            onGenderChange={setGender}
          />
        </View>

        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Vêtements sélectionnés ({selectedClothes.length})</Text>
          {selectedClothes.length === 0 ? (
            <View style={styles.emptySelection}>
              <Text style={styles.emptyText}>Aucun vêtement sélectionné</Text>
              <Text style={styles.emptySubtext}>Sélectionnez des vêtements en appuyant sur le bouton ci-dessous</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedClothesContainer}
            >
              {selectedClothesItems.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.selectedClothingItem}
                  onPress={() => {
                    setSelectedClothes(prev => prev.filter(id => id !== item.id));
                  }}
                >
                  <Image source={{ uri: item.image_url }} style={styles.selectedClothingImage} />
                  <View style={styles.removeIcon}>
                    <Ionicons name="close-circle" size={20} color="#F97A5C" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <TouchableOpacity 
            style={styles.wardrobeButton}
            onPress={navigateToWardrobeSelect}
          >
            <Ionicons name="shirt-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.wardrobeButtonText}>
              {selectedClothes.length > 0 ? "Modifier la sélection" : "Choisir des vêtements"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={updateOutfit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#333',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
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
    backgroundColor: '#F97A5C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  wardrobeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#F97A5C',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  seasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '48%',
    marginHorizontal: '1%',
  },
  seasonButtonActive: {
    backgroundColor: '#F97A5C',
  },
  seasonButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  seasonButtonTextActive: {
    color: '#fff',
  },
  occasionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  occasionButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    marginHorizontal: '1%',
  },
  occasionButtonActive: {
    backgroundColor: '#F97A5C'
  },
  occasionButtonText: {
    color: '#666',
    fontSize: 14,
  },
  occasionButtonTextActive: {
    color: '#fff',
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '48%',
    marginHorizontal: '1%',
  },
  visibilityButtonActive: {
    backgroundColor: '#F97A5C',
  },
  visibilityButtonText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 6,
  },
  visibilityButtonTextActive: {
    color: '#fff',
  },
}); 