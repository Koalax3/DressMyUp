import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Like, Outfit, User, ClothingItem } from '../types';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { likeOutfit } from '@/services/likeService';
import MatchingPieChart from './MatchingPieChart';
import { calculateMatchingPercentage } from '@/services/matchingService';

// Obtenir la largeur de l'écran pour calculer la taille des images
const screenWidth = Dimensions.get('window').width;
const itemWidth = (screenWidth - 30 - 10) / 2; // 30 pour les paddings, 10 pour l'espace entre les colonnes

type OutfitPreviewProps = {
  outfit: Outfit;
  userWardrobe?: ClothingItem[];
};

const OutfitPreview = ({ outfit, userWardrobe = [] }: OutfitPreviewProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [matchingPercentage, setMatchingPercentage] = useState(0);

  useEffect(() => {
    if(outfit.likes) {
      setIsLiked(true);
    }
    if (userWardrobe.length > 0) {
      const percentage = calculateMatchingPercentage(outfit, userWardrobe);
      setMatchingPercentage(percentage);
    }
  }, [outfit.likes, userWardrobe]);

  const onLike = async () => {
      if (!user) return;
      try {
        // Vérifier si l'utilisateur a déjà aimé cette tenue
        await likeOutfit(outfit.id, user.id);
        setIsLiked(!isLiked);
      } catch (error) {
        console.error('Erreur:', error);
      }
  }

  return (
    <View style={styles.outfitCard}>
      <TouchableOpacity 
        onPress={() => router.push({
          pathname: '/outfit/[id]',
          params: { id: outfit.id }
        })}
      >
        <View style={{position: 'relative'}}>
          <Image 
            source={{ uri: outfit.image_url || 'https://via.placeholder.com/400' }} 
            style={styles.outfitImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: '100%',
              width: '100%'
            }}
            start={{x: 0.5, y: 0.5}}
            end={{x: 0.5, y: 1}}
          />
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => router.push({
          pathname: '/(tabs)/profile',
          params: { userId: outfit.user.id }
        })}
      >
        <Image 
          source={{ uri: outfit.user.avatar_url }} 
          style={styles.avatar}
        />
      </TouchableOpacity>
      {user && user.id !== outfit.user.id && (
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => onLike()}
        >
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={32} color="#F97A5C" />
        </TouchableOpacity>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.outfitName}>{outfit.name}</Text>
      </View>
      <View style={styles.matchingContainer}>
      {userWardrobe.length > 0 && user && user.id !== outfit.user.id && (
          <View style={styles.matchingContainer}>
            <MatchingPieChart percentage={matchingPercentage} size={24} />
          </View>
        )}
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
    position: 'relative',
  },
  userInfo: {
    top: 5,
    left: 5,
    position: 'absolute',
    padding: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#fff',
  },
  username: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  outfitImage: {
    width: '100%',
    height: itemWidth * 1.5, // Aspect ratio ~5:6
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    color: '#fff',
  },
  outfitName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  heartButton: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    borderRadius: 15,
    padding: 5,
  },
  matchingText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  matchingContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
});

export default OutfitPreview; 