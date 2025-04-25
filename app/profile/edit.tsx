import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getThemeColors } from '@/constants/Colors';
import { UserService } from '@/services';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    if (username.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Le nom d\'utilisateur ne peut pas être vide'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Mettre à jour le profil utilisateur
      await updateProfile({ username, bio });
      
      Toast.show({
        type: 'success',
        text1: 'Profil mis à jour avec succès'
      });
      router.back();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      Toast.show({
        type: 'error',
        text1: 'Une erreur s\'est produite lors de la mise à jour du profil'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      uploadAvatar(result.assets[0].base64);
    }
  };

  const uploadAvatar = async (base64Image: string) => {
    if (!user) return;

    try {
      setUploadingAvatar(true);
      
      // Utiliser le service pour télécharger l'avatar
      const newAvatarUrl = await UserService.uploadAvatar(user.id, base64Image);
      
      // Mettre à jour le profil utilisateur
      await updateProfile({ avatar_url: newAvatarUrl });
      
      // Mettre à jour l'état local
      setAvatarUrl(newAvatarUrl);
    } catch (error) {
      console.error('Erreur:', error);
      Toast.show({
        type: 'error',
        text1: 'Une erreur s\'est produite lors du téléchargement de l\'avatar'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? colors.background.dark : '#f0f0f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.main} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.main }]}>Éditer le profil</Text>
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { backgroundColor: colors.primary.main },
            isLoading && { opacity: 0.7 }
          ]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarContainer}>
        <TouchableOpacity style={[
          styles.avatarWrapper, 
          { borderColor: isDarkMode ? colors.background.dark : '#eee' }
        ]} onPress={pickAvatar} disabled={uploadingAvatar}>
          {uploadingAvatar ? (
            <ActivityIndicator size="large" color={colors.primary.main} />
          ) : (
            <>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[
                  styles.avatarPlaceholder, 
                  { backgroundColor: isDarkMode ? colors.background.deep : '#f5f5f5' }
                ]}>
                  <Ionicons name="person" size={60} color={isDarkMode ? colors.text.light : "#ccc"} />
                </View>
              )}
              <View style={[
                styles.editAvatarButton, 
                { 
                  backgroundColor: colors.primary.main,
                  borderColor: colors.background.main 
                }
              ]}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text.main }]}>Nom d'utilisateur</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: isDarkMode ? colors.background.deep : '#f5f5f5',
              color: colors.text.main
            }
          ]}
          value={username}
          onChangeText={setUsername}
          placeholder="Votre nom d'utilisateur"
          placeholderTextColor={colors.text.light}
        />
        
        <Text style={[styles.label, { color: colors.text.main }]}>Biographie</Text>
        <TextInput
          style={[
            styles.input, 
            styles.bioInput, 
            { 
              backgroundColor: isDarkMode ? colors.background.deep : '#f5f5f5',
              color: colors.text.main
            }
          ]}
          value={bio}
          onChangeText={setBio}
          placeholder="Parlez-nous de vous..."
          placeholderTextColor={colors.text.light}
          multiline={true}
          numberOfLines={4}
        />
      </View>
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
  saveButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
}); 