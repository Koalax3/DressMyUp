import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Outfit, User } from '../types';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Obtenir la largeur de l'écran pour calculer la taille des images
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 30 - 10) / 2; // 30 pour les paddings, 10 pour l'espace entre les colonnes

type OutfitPreviewProps = {
  outfit: Outfit & { user: User };
  onLike?: (outfitId: string) => void;
};

const OutfitPreview = ({ outfit, onLike }: OutfitPreviewProps) => {
  return (
    <View style={styles.outfitCard}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => router.push({
          pathname: '/(tabs)/profile',
          params: { userId: outfit.user.id }
        })}
      >
        <Image 
          source={{ uri: outfit.user.avatar_url || 'https://via.placeholder.com/50' }} 
          style={styles.avatar}
        />
        <Text style={styles.username}>{outfit.user.username}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/outfit/[id]',
          params: { id: outfit.id }
        })}
      >
        <Image 
          source={{ uri: outfit.image_url || 'https://via.placeholder.com/400' }} 
          style={styles.outfitImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.heartButton}
        onPress={() => onLike && onLike(outfit.id)}
      >
        <Ionicons name="heart" size={26} color="#FF6B6B" />
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.outfitName}>{outfit.name}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outfitCard: {
    width: itemWidth,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  username: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  outfitImage: {
    width: '100%',
    height: itemWidth * 1.2, // Aspect ratio ~5:6
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    padding: 8,
  },
  outfitName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  heartButton: {
    position: 'absolute',
    bottom: 40,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 5,
  },
});

export default OutfitPreview; 