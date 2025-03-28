import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from '../../components/ImagePicker';
import { decode } from 'base64-arraybuffer';
import { createClothing, uploadClothingImage } from '../../services/clothingService';
import { ClothingSubType, ClothingType } from '../../types';
import { subtypesByType, types, COLORS, BRANDS, PATTERNS } from '../../constants/Clothes';
import ColorSelector from '../../components/ColorSelector';
import BrandSelector from '../../components/BrandSelector';
import PatternSelector from '../../components/PatternSelector';
import MaterialSelector from '../../components/MaterialSelector';

export default function AddClothingScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [type, setType] = useState<ClothingType>('top');
  const [subtype, setSubtype] = useState<ClothingSubType | undefined>(undefined);
  const [color, setColor] = useState<string | null>(null);
  const [fit, setFit] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [pattern, setPattern] = useState<string | null>('plain');
  const [patternModalVisible, setPatternModalVisible] = useState(false);
  const [material, setMaterial] = useState<string | null>(null);

  // Mettre à jour le sous-type quand le type change
  useEffect(() => {
    setSubtype(undefined);
  }, [type]);

  // Trouver l'objet couleur correspondant pour l'affichage
  const selectedColorObject = COLORS.find(c => c.name === color);

  // Filtrer les marques en fonction de la recherche
  const filteredBrands = BRANDS.filter(b => 
    b.toLowerCase().includes(brandSearch.toLowerCase())
  ).sort((a, b) => a.localeCompare(b));

  const openColorModal = () => {
    setColorModalVisible(true);
  };

  const closeColorModal = () => {
    setColorModalVisible(false);
  };

  const selectColor = (colorName: string) => {
    setColor(colorName);
    closeColorModal();
  };

  const openBrandModal = () => {
    setBrandModalVisible(true);
  };

  const closeBrandModal = () => {
    setBrandModalVisible(false);
    setBrandSearch('');
  };

  const selectBrand = (brandName: string) => {
    setBrand(brandName);
    closeBrandModal();
  };

  const renderColorItem = ({ item }: { item: typeof COLORS[0] }) => (
    <TouchableOpacity
      style={styles.colorItem}
      onPress={() => selectColor(item.name)}
    >
      <View style={styles.colorItemContent}>
        <View 
          style={[
            styles.colorCircle, 
            { 
              backgroundColor: item.value === 'linear-gradient' 
                ? 'transparent' 
                : item.value,
            }
          ]}
        >
          {item.value === 'linear-gradient' && (
            <View style={styles.multicolorCircle}>
              <View style={[styles.multiColorSegment, { backgroundColor: '#FF0000', top: 0, left: 0 }]} />
              <View style={[styles.multiColorSegment, { backgroundColor: '#00FF00', top: 0, right: 0 }]} />
              <View style={[styles.multiColorSegment, { backgroundColor: '#0000FF', bottom: 0, left: 0 }]} />
              <View style={[styles.multiColorSegment, { backgroundColor: '#FFFF00', bottom: 0, right: 0 }]} />
            </View>
          )}
        </View>
        <Text style={styles.colorName}>
          {item.name}
        </Text>
      </View>
      {item.name === color && (
        <Ionicons name="checkmark" size={18} color="#F97A5C" />
      )}
    </TouchableOpacity>
  );

  const renderBrandItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.brandItem}
      onPress={() => selectBrand(item)}
    >
      <Text style={styles.brandName}>{item}</Text>
      {item === brand && (
        <Ionicons name="checkmark" size={18} color="#F97A5C" />
      )}
    </TouchableOpacity>
  );

  const handleSubmit = async () => {
    if (!user || !image) return;
    
    if (!name || !color) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (nom, couleur) et ajouter une image');
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadClothingImage(user.id, image);
      
      if (!imageUrl) {
        Alert.alert('Erreur', 'Impossible de télécharger l\'image');
        setUploading(false);
        return;
      }
      
      // Créer l'objet vetement
      const clothingData = {
        name,
        brand: brand || undefined,
        type,
        subtype,
        color,
        fit: fit as 'slim' | 'regular' | 'loose' | 'oversize' | undefined,
        image_url: imageUrl,
        pattern,
        material: material || undefined,
      };
      
      // Créer le vêtement dans la base de données
      await createClothing(user.id, clothingData);
      
      Alert.alert(
        'Succès',
        'Vêtement ajouté avec succès!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  // Obtenir les sous-types pour le type sélectionné
  const availableSubtypes = subtypesByType[type] || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Ajouter un vêtement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Image*</Text>
        <ImagePicker 
          imageUri={image}
          onImageSelected={(uri) => setImage(uri)}
          onImageRemoved={() => setImage(null)}
          uploading={uploading}
        />

        <Text style={styles.label}>Nom*</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: T-shirt blanc"
        />

        <Text style={styles.label}>Marque</Text>
        <BrandSelector 
          selectedBrand={brand}
          onBrandSelect={setBrand}
        />

        <Text style={styles.label}>Type*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue as ClothingType)}
            style={styles.picker}
          >
            {Object.entries(types).map(([key, label]) => (
              <Picker.Item key={key} label={label} value={key} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Sous-type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={subtype}
            onValueChange={(itemValue) => setSubtype(itemValue as ClothingSubType)}
            style={styles.picker}
          >
            <Picker.Item label="Sélectionner un sous-type" value={undefined} />
            {Object.entries(availableSubtypes).map(([key, label]) => (
              <Picker.Item key={key} label={label} value={key} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Couleur*</Text>
        <ColorSelector 
          selectedColor={color}
          onColorSelect={setColor}
        />

        <Text style={styles.label}>Motif</Text>
        <PatternSelector 
          selectedPattern={pattern}
          onPatternSelect={setPattern}
        />

        <Text style={styles.label}>Matériau</Text>
        <MaterialSelector
          selectedMaterial={material}
          onMaterialSelect={setMaterial}
        />

        <Text style={styles.label}>Coupe</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={fit}
            onValueChange={(itemValue) => setFit(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Sélectionner une coupe" value={undefined} />
            <Picker.Item label="Slim" value="slim" />
            <Picker.Item label="Regular" value="regular" />
            <Picker.Item label="Loose" value="loose" />
            <Picker.Item label="Oversize" value="oversize" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Ajouter</Text>
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 5,
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#F97A5C',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  colorSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedColorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  colorSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  colorList: {
    padding: 15,
  },
  colorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  colorName: {
    fontSize: 16,
    color: '#333',
  },
  multicolorCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  multiColorSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  multicolorCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  multiColorSegmentSmall: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  brandList: {
    padding: 15,
    paddingTop: 0,
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brandName: {
    fontSize: 16,
    color: '#333',
  },
  customBrandItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  customBrandText: {
    fontSize: 16,
    color: '#F97A5C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#f9f9f9',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
  },
}); 