import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ASPECT_RADIO_IMAGE, BASE64, QUALITY_IMAGE } from '@/constants/Common';

interface ImagePickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
  uploading?: boolean;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ 
  imageUri, 
  onImageSelected, 
  onImageRemoved, 
  uploading = false 
}) => {
  
  // Fonction pour sélectionner une image depuis la galerie
  const pickImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie.');
        return;
      }
      
      // Lancer le sélecteur d'image
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: ASPECT_RADIO_IMAGE,
        quality: QUALITY_IMAGE,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        // Si nous avons la base64, l'utiliser de préférence
        if (result.assets[0].base64) {
          const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
          onImageSelected(base64Uri);
        } else {
          // Sinon utiliser l'URI standard
          onImageSelected(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };
  
  // Fonction pour prendre une photo avec la caméra
  const takePhoto = async () => {
    try {
      // Demander la permission d'accéder à la caméra
      const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre caméra.');
        return;
      }
      
      // Lancer la caméra
      const result = await ImagePickerExpo.launchCameraAsync({
        allowsEditing: true,
        aspect: ASPECT_RADIO_IMAGE,
        quality: QUALITY_IMAGE,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        // Si nous avons la base64, l'utiliser de préférence
        if (result.assets[0].base64) {
          const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
          onImageSelected(base64Uri);
        } else {
          // Sinon utiliser l'URI standard
          onImageSelected(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  return (
    <View style={styles.imagePicker}>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.imagePreview} 
            resizeMode="contain"
          />
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : (
            <TouchableOpacity style={styles.removeImageButton} onPress={onImageRemoved}>
              <Ionicons name="close-circle" size={28} color="#F97A5C" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.imageButtonsContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color="#666" />
            <Text style={styles.imageButtonText}>Galerie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color="#666" />
            <Text style={styles.imageButtonText}>Caméra</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imagePicker: {
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 250,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 15,
    padding: 5,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
});

export default ImagePicker; 