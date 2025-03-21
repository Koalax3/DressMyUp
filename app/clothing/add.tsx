import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
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
import { subtypesByType, types } from '../../constants/Clothes';

export default function AddClothingScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<ClothingType>('top');
  const [subtype, setSubtype] = useState<ClothingSubType | undefined>(undefined);
  const [color, setColor] = useState('');
  const [fit, setFit] = useState<string | undefined>(undefined);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Mettre à jour le sous-type quand le type change
  useEffect(() => {
    setSubtype(undefined);
  }, [type]);

  const createClothingItem = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour ajouter un vêtement');
      return;
    }
    
    if (!name || !color || !image) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires et ajouter une image');
      return;
    }
    
    setUploading(true);
    
    try {
      // Télécharger l'image
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
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Ex: Nike"
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
        <TextInput
          style={styles.input}
          value={color}
          onChangeText={setColor}
          placeholder="Ex: Blanc"
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
          onPress={createClothingItem}
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
    backgroundColor: '#FF6B6B',
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
}); 