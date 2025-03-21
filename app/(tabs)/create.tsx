import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
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

export default function CreateOutfitScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('all');
  const [occasion, setOccasion] = useState('casual');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ClothingType>('top');
  const [activeSubtype, setActiveSubtype] = useState<ClothingSubType | undefined>(undefined);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchClothes();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchClothes();
        if (params.selectItem) {
          setSelectedClothes(prev => 
            prev.includes(params.selectItem as string) 
              ? prev 
              : [...prev, params.selectItem as string]
          );
        }
      }
    }, [user, params.selectItem])
  );

  // Réinitialiser le sous-type actif quand le type change
  useEffect(() => {
    setActiveSubtype(undefined);
  }, [activeTab]);

  const fetchClothes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const clothesData = await ClothingService.fetchUserClothes(user.id);
      setClothes(clothesData);
    } catch (error) {
      console.error('Erreur lors de la récupération des vêtements:', error);
      Alert.alert('Erreur', 'Impossible de charger vos vêtements');
    } finally {
      setLoading(false);
    }
  };

  const toggleClothingSelection = (id: string) => {
    if (selectedClothes.includes(id)) {
      setSelectedClothes(selectedClothes.filter(itemId => itemId !== id));
    } else {
      setSelectedClothes([...selectedClothes, id]);
    }
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
    
    if (!name || selectedClothes.length === 0) {
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
      };

      const newOutfit = await OutfitService.createOutfit(user.id, outfitData);

      if (!newOutfit) {
        Alert.alert('Erreur', 'Impossible de créer la tenue. Veuillez réessayer.');
        return;
      }

      const outfitId = newOutfit.id;

      // Étape 3: Associer les vêtements à la tenue
      const success = await OutfitService.associateClothesToOutfit(
        outfitId,
        selectedClothes
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
          setSelectedClothes([]);
          setOutfitImage(null);
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

  // Filtrer les vêtements par type et sous-type
  const filteredClothes = clothes.filter(item => {
    const typeMatch = item.type === activeTab;
    // Si aucun sous-type n'est sélectionné, afficher tous les vêtements du type sélectionné
    if (!activeSubtype) return typeMatch;
    // Sinon, filtrer aussi par sous-type
    return typeMatch && item.subtype === activeSubtype;
  });

  // Obtenir les sous-types disponibles pour le type actif
  const availableSubtypes = subtypesByType[activeTab] || {};
  
  // Vérifier si des vêtements sont disponibles pour ce type
  const hasClothesOfType = clothes.some(item => item.type === activeTab);

  // Vérifier si des vêtements sont disponibles pour ce sous-type
  const hasClothesOfSubtype = activeSubtype ? clothes.some(item => item.type === activeTab && item.subtype === activeSubtype) : true;

  const selectedClothesItems = clothes.filter(item => selectedClothes.includes(item.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Créer une tenue</Text>
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
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optionnelle)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
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
        </View>

        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Vêtements sélectionnés</Text>
          {selectedClothesItems.length === 0 ? (
            <View style={styles.emptySelection}>
              <Text style={styles.emptyText}>Aucun vêtement sélectionné</Text>
              <Text style={styles.emptySubtext}>Sélectionnez des vêtements ci-dessous</Text>
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
                  onPress={() => toggleClothingSelection(item.id)}
                >
                  <Image source={{ uri: item.image_url }} style={styles.selectedClothingImage} />
                  <View style={styles.removeIcon}>
                    <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.clothesSection}>
          <Text style={styles.sectionTitle}>Ajouter des vêtements</Text>
          
          {/* Tabs pour filtrer par type */}
          <View style={styles.tabs}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'top' && styles.activeTab]} 
              onPress={() => setActiveTab('top')}
            >
              <Text style={[styles.tabText, activeTab === 'top' && styles.activeTabText]}>Hauts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'bottom' && styles.activeTab]} 
              onPress={() => setActiveTab('bottom')}
            >
              <Text style={[styles.tabText, activeTab === 'bottom' && styles.activeTabText]}>Bas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'shoes' && styles.activeTab]} 
              onPress={() => setActiveTab('shoes')}
            >
              <Text style={[styles.tabText, activeTab === 'shoes' && styles.activeTabText]}>Chaussures</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'accessory' && styles.activeTab]} 
              onPress={() => setActiveTab('accessory')}
            >
              <Text style={[styles.tabText, activeTab === 'accessory' && styles.activeTabText]}>Accessoires</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'ensemble' && styles.activeTab]} 
              onPress={() => setActiveTab('ensemble')}
            >
              <Text style={[styles.tabText, activeTab === 'ensemble' && styles.activeTabText]}>Ensembles</Text>
            </TouchableOpacity>
          </View>

          {/* Sous-types pour le type actif */}
          {hasClothesOfType && Object.keys(availableSubtypes).length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.subtypeScrollView}
              contentContainerStyle={styles.subtypeContainer}
            >
              <TouchableOpacity 
                style={[styles.subtypeButton, activeSubtype === undefined && styles.activeSubtypeButton]}
                onPress={() => setActiveSubtype(undefined)}
              >
                <Text style={[styles.subtypeText, activeSubtype === undefined && styles.activeSubtypeText]}>Tous</Text>
              </TouchableOpacity>
              {Object.entries(availableSubtypes).map(([key, label]) => (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.subtypeButton, activeSubtype === key && styles.activeSubtypeButton]}
                  onPress={() => setActiveSubtype(key as ClothingSubType)}
                >
                  <Text style={[styles.subtypeText, activeSubtype === key && styles.activeSubtypeText]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
          ) : !hasClothesOfType ? (
            <View style={styles.emptyClothes}>
              <Text style={styles.emptyText}>Aucun vêtement de ce type trouvé</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/clothing/add')}
              >
                <Text style={styles.addButtonText}>Ajouter un vêtement</Text>
              </TouchableOpacity>
            </View>
          ) : !hasClothesOfSubtype ? (
            <View style={styles.emptyClothes}>
              <Text style={styles.emptyText}>Aucun vêtement de ce sous-type trouvé</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/clothing/add')}
              >
                <Text style={styles.addButtonText}>Ajouter un vêtement</Text>
              </TouchableOpacity>
            </View>
          ) : filteredClothes.length === 0 ? (
            <View style={styles.emptyClothes}>
              <Text style={styles.emptyText}>Aucun vêtement trouvé</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/clothing/add')}
              >
                <Text style={styles.addButtonText}>Ajouter un vêtement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.clothesGrid}>
              {filteredClothes.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.clothingItem,
                    selectedClothes.includes(item.id) && styles.selectedItem
                  ]}
                  onPress={() => toggleClothingSelection(item.id)}
                >
                  <Image source={{ uri: item.image_url }} style={styles.clothingImage} />
                  {selectedClothes.includes(item.id) && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveOutfit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Créer la tenue</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
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
  },
  selectedClothesContainer: {
    paddingVertical: 10,
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
  clothesSection: {
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subtypeScrollView: {
    marginBottom: 15,
  },
  subtypeContainer: {
    paddingVertical: 5,
  },
  subtypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeSubtypeButton: {
    backgroundColor: '#FFE0E0',
    borderColor: '#FF6B6B',
  },
  subtypeText: {
    color: '#666',
    fontSize: 13,
  },
  activeSubtypeText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyClothes: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clothesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  clothingItem: {
    width: '31%',
    marginBottom: 15,
    position: 'relative',
  },
  clothingImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 10,
  },
  checkIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
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
    backgroundColor: '#FF6B6B',
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
    backgroundColor: '#FF6B6B'
  },
  occasionButtonText: {
    color: '#666',
    fontSize: 14,
  },
  occasionButtonTextActive: {
    color: '#fff',
  },
}); 