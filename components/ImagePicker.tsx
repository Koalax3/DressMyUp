import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { ASPECT_RADIO_IMAGE, QUALITY_IMAGE } from '@/constants/Common';

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
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      setError(null);
      
      // Demander la permission d'accéder à la bibliothèque de photos
      const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Nous avons besoin de votre permission pour accéder à votre galerie.');
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
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = selectedAsset.uri;
        
        if (selectedAsset.base64) {
          // Format base64 pour l'upload
          onImageSelected(`data:image/jpeg;base64,${selectedAsset.base64}`);
        } else {
          onImageSelected(uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      setError('Une erreur s\'est produite lors de la sélection de l\'image.');
    }
  };

  const takePicture = async () => {
    try {
      setError(null);
      
      // Demander la permission d'accéder à la caméra
      const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Nous avons besoin de votre permission pour accéder à votre caméra.');
        return;
      }
      
      // Lancer l'appareil photo
      const result = await ImagePickerExpo.launchCameraAsync({
        allowsEditing: true,
        aspect: ASPECT_RADIO_IMAGE,
        quality: QUALITY_IMAGE,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = selectedAsset.uri;
        
        if (selectedAsset.base64) {
          // Format base64 pour l'upload
          onImageSelected(`data:image/jpeg;base64,${selectedAsset.base64}`);
        } else {
          onImageSelected(uri);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      setError('Une erreur s\'est produite lors de la prise de photo.');
    }
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          
          {uploading ? (
            <View style={[styles.uploadingOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
              <ActivityIndicator size="large" color={colors.primary.main} />
              <Text style={[styles.uploadingText, { color: colors.text.bright }]}>Chargement...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.removeButton, { backgroundColor: colors.background.main }]} 
              onPress={onImageRemoved}
            >
              <Ionicons name="trash-outline" size={22} color={colors.primary.main} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.placeholderContainer, { backgroundColor: colors.gray }]}>
          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.primary.main }]}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={28} color={colors.white} />
              <Text style={[styles.optionButtonText, { color: colors.white }]}>Galerie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.primary.main }]}
              onPress={takePicture}
            >
              <Ionicons name="camera-outline" size={28} color={colors.white} />
              <Text style={[styles.optionButtonText, { color: colors.white }]}>Appareil photo</Text>
            </TouchableOpacity>
          </View>
          
          {error && (
            <Text style={[styles.errorText, { color: colors.primary.main }]}>{error}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 3/4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderContainer: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    aspectRatio: 1,
    width: 'auto',
  },
  optionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ImagePicker; 