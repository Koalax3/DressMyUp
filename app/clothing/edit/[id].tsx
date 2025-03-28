import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../../constants/Supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { ClothingItem, ClothingSubType, ClothingType } from '../../../types';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ImagePicker from '../../../components/ImagePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decode } from 'base64-arraybuffer';
import { getClothingById, updateClothing as updateClothingService, uploadClothingImage } from '../../../services/clothingService';
import { subtypesByType, types } from '../../../constants/Clothes';
import ColorSelector from '../../../components/ColorSelector';
import BrandSelector from '../../../components/BrandSelector';
import PatternSelector from '../../../components/PatternSelector';
import MaterialSelector from '../../../components/MaterialSelector';

export default function EditClothingScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<string | null>(null);
  const [type, setType] = useState<ClothingType>('top');
  const [subtype, setSubtype] = useState<ClothingSubType | undefined>(undefined);
  const [color, setColor] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [fit, setFit] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchClothingItem();
  }, [id]);

  const fetchClothingItem = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const data = await getClothingById(id.toString(), user.id);

      if (data) {
        setName(data.name || '');
        setBrand(data.brand || null);
        setType(data.type || 'top');
        setSubtype(data.subtype || 't-shirt');
        setColor(data.color || null);
        setPattern(data.pattern || null);
        setMaterial(data.material || null);
        setFit(data.fit || undefined);
        setImage(data.image_url);
        setOriginalImage(data.image_url);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les informations du vêtement.');
        router.back();
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const updateClothing = async () => {
    if (!user || !id) return;
    
    if (!name || !color || !image) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires et ajouter une image');
      return;
    }

    setSaving(true);

    try {
      setUploadingImage(true);
      // Télécharger l'image uniquement si elle a été modifiée
      let imageUrl = originalImage;
      if (image !== originalImage) {
        imageUrl = await uploadClothingImage(user.id, image);
      }
      
      if (!imageUrl) {
        Alert.alert('Erreur', 'Impossible de télécharger l\'image. Veuillez réessayer.');
        setSaving(false);
        setUploadingImage(false);
        return;
      }

      // Utiliser des assertions de type pour s'assurer que les types correspondent
      console.log('material', material);
      const clothingData = {
        name,
        brand: brand || undefined,
        type,
        subtype,
        color,
        pattern,
        material: material || undefined,
        fit: fit as 'slim' | 'regular' | 'loose' | 'oversize' | undefined,
        image_url: imageUrl,
      };

      console.log('Mise à jour du vêtement avec données:', clothingData);

      const success = await updateClothingService(id.toString(), user.id, clothingData);

      if (!success) {
        Alert.alert('Erreur', 'Impossible de mettre à jour le vêtement. Veuillez réessayer.');
      } else {
        Alert.alert(
          'Succès',
          'Vêtement mis à jour avec succès!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  // Obtenir les sous-types pour le type sélectionné
  const availableSubtypes = subtypesByType[type] || {};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97A5C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le vêtement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Image du vêtement */}
        <Text style={styles.sectionTitle}>Image*</Text>
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
          onPress={updateClothing}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#F97A5C',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 