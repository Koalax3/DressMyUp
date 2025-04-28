import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Share } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { OutfitService } from '../../services';
import { counterLikes, updateOutfit } from '@/services/outfitService';
import ClotheView from '@/components/ClotheView';
import PublicSwitch from '@/components/PublicSwitch';
import { genders, occasions, seasons } from '@/constants/Outfits';
import { Outfit, User, ClothingItem, Comment } from '@/types';
import { ColorsTheme } from '@/constants/Colors';
import MatchingProgressBar from '@/components/MatchingProgressBar';
import { calculateMatchingPercentage } from '@/services/matchingService';
import { supabase } from '@/constants/Supabase';
import CommentsSection from '@/components/CommentsSection';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DEFAULT_USER_AVATAR } from '@/constants/Users';
import Header from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useClothing } from '@/contexts/ClothingContext';

// Définir le type localement pour correspondre exactement à ce que nous utilisons
interface OutfitWithDetails extends Outfit {
  user: User;
  clothes: ClothingItem[];
  comments: (Comment & { user: User })[];
  isPublic?: boolean;
  gender?: 'male' | 'female' | 'unisex';
  updated_at: string;
}

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [outfit, setOutfit] = useState<OutfitWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [deleting, setDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [matchingPercentage, setMatchingPercentage] = useState(0);
  const { isDarkMode } = useTheme();
  const { clothes } = useClothing();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    if (id) {
      fetchOutfitDetails();
      checkIfLiked();
      fetchLikesCount();
    }
  }, [id, user]);

  const fetchLikesCount = async () => {
    if (!id) return;
    try {
      const count = await counterLikes(id as string);
      setLikesCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du comptage des likes:', error);
    }
  };

  const fetchOutfitDetails = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const outfitDetails = await OutfitService.fetchOutfitDetails(id as string);
      // Récupérer les données et les adapter à notre type local
      setOutfit({
        ...outfitDetails,
        isPublic: outfitDetails.isPublic !== false,
        gender: (outfitDetails.gender as 'male' | 'female' | 'unisex') || 'unisex',
        updated_at: outfitDetails.created_at
      } as OutfitWithDetails);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la tenue');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !id) return;

    try {
      const isLiked = await OutfitService.checkIfLiked(user.id, id as string);
      setLiked(isLiked);
    } catch (error) {
      console.error('Erreur lors de la vérification du like:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !id || !outfit) return;

    try {
      const isNowLiked = await OutfitService.toggleLikeOutfit(user.id, id as string);
      
      setLiked(isNowLiked);
      fetchLikesCount();
    } catch (error) {
      console.error('Erreur lors du like/unlike:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handlePublicToggle = async (newValue: boolean) => {
    if (!user || !id || !outfit || user.id !== outfit.user_id) return;
    
    setIsUpdating(true);
    try {
      await updateOutfit(id as string, { isPublic: newValue });
      setOutfit({
        ...outfit,
        isPublic: newValue,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la visibilité:', error);
      Alert.alert('Erreur', 'Impossible de modifier la visibilité');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenderChange = async (newGender: string) => {
    if (!user || !id || !outfit || user.id !== outfit.user_id) return;
    
    setIsUpdating(true);
    try {
      await updateOutfit(id as string, { gender: newGender });
      setOutfit({
        ...outfit,
        gender: newGender as 'male' | 'female' | 'unisex',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du genre:', error);
      Alert.alert('Erreur', 'Impossible de modifier le genre');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!user || !outfit) return;

    Alert.alert(
      'Supprimer la tenue',
      'Êtes-vous sûr de vouloir supprimer cette tenue? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await OutfitService.deleteOutfit(id as string, user.id);
              Alert.alert('Succès', 'La tenue a été supprimée avec succès');
              router.back();
            } catch (error) {
              console.error('Erreur lors de la suppression de la tenue:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la tenue');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const shareOutfit = () => {
    if (!outfit) return;
    const shareData = {
      title: outfit.name,
      message: `Voir cette tenue: ${outfit.name}`,
      url: outfit.image_url
    };
    Share.share(shareData);
  };
  
  const handleEdit = () => {
    if (!user || !outfit) return;
    
    router.push({
      pathname: '/outfit/edit/[id]',
      params: { id: id as string }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (outfit && clothes.length > 0) {
      const percentage = calculateMatchingPercentage(outfit, clothes);
      setMatchingPercentage(percentage);
    }
  }, [outfit, clothes]);

  // Ajouter un commentaire
  const handleCommentAdded = (newComment: Comment & { user: User }) => {
    if (!outfit) return;
    
    setOutfit({
      ...outfit,
      comments: [newComment, ...outfit.comments],
    });
  };

  // Supprimer un commentaire
  const handleCommentDeleted = (commentId: string) => {
    if (!outfit) return;
    
    setOutfit({
      ...outfit,
      comments: outfit.comments.filter(comment => comment.id !== commentId),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background.main }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background.main }]}>
        <Text style={[styles.errorText, { color: colors.text.main }]}>Tenue introuvable</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary.main }]} onPress={() => router.back()}>
          <Text style={[styles.buttonText, { color: colors.text.bright }]}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOwner = user && user.id === outfit.user_id;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScrollView>
          <Header title={outfit.name} back >
          <View style={{flexDirection: 'row', gap: 15}}>
            {outfit.isPublic && <TouchableOpacity onPress={shareOutfit}>
                <Ionicons name="share-outline" size={28} color={isDarkMode ? colors.white : colors.secondary.dark} />
              </TouchableOpacity>}
              {isOwner && (
              <TouchableOpacity onPress={handleEdit}>
                {(
                  <Ionicons name="create-outline" size={28} color={isDarkMode ? colors.white : colors.secondary.dark} />
                )}
              </TouchableOpacity>
            )}
            {isOwner && (
              <TouchableOpacity onPress={handleDelete} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.primary.main} />
                ) : (
                  <Ionicons name="trash-outline" size={28} color={colors.primary.main} />
                )}
              </TouchableOpacity>
            )}
            </View>
          </Header>

          {outfit.image_url && (
            <View style={styles.outfitImageContainer}>
              <Image 
                source={{ uri: outfit.image_url }} 
                style={styles.outfitImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={[styles.userInfo, { borderBottomColor: colors.text.lighter }]}>
            <TouchableOpacity 
              style={styles.userContainer}
              onPress={() => router.push({
                pathname: '/profile/[id]',
                params: { id: outfit.user.id }
              })}
            >
              <Image 
                source={{ uri: outfit.user.avatar_url || DEFAULT_USER_AVATAR }} 
                style={styles.avatar}
              />
              <Text style={[styles.username, { color: colors.text.main }]}>{outfit.user.username}</Text>
            </TouchableOpacity>
            <Text style={[styles.date, { color: colors.text.light }]}>{formatDate(outfit.created_at)}</Text>
          </View>
          
          <View style={styles.metadataContainer}>
            {outfit.season && (
              <View style={[styles.metadataItem, { backgroundColor: colors.gray }]}>
                <Ionicons name="sunny-outline" size={18} color={colors.primary.main} style={styles.metadataIcon} />
                <Text style={[styles.metadataText, { color: colors.text.main }]}>
                  {seasons[outfit.season]}
                </Text>
              </View>
            )}
            
            {outfit.occasion && (
              <View style={[styles.metadataItem, { backgroundColor: colors.gray }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary.main} style={styles.metadataIcon} />
                <Text style={[styles.metadataText, { color: colors.text.main }]}>
                  {occasions[outfit.occasion] || outfit.occasion}
                </Text>
              </View>
            )}
            
            {outfit.gender && (
              <View style={[styles.metadataItem, { backgroundColor: colors.gray }]}>
                <Ionicons 
                  name={
                    outfit.gender === 'male' ? 'male-outline' :
                    outfit.gender === 'female' ? 'female-outline' :
                    'people-outline'
                  } 
                  size={18} 
                  color={colors.primary.main} 
                  style={styles.metadataIcon} 
                />
                <Text style={[styles.metadataText, { color: colors.text.main }]}>
                  {genders[outfit.gender] || outfit.gender}
                </Text>
              </View>
            )}
          </View>
          {outfit.description && (
            <Text style={[styles.description, { color: colors.text.light }]}>{outfit.description}</Text>
          )}
          {/* Paramètres de l'outfit (uniquement pour le propriétaire) */}
          {isOwner && (
            <View style={styles.settingsContainer}>
              <View style={[styles.settingSeparator, { backgroundColor: colors.text.lighter }]} />
              
              {isUpdating ? (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color={colors.primary.main} />
                  <Text style={[styles.loadingText, { color: colors.text.main }]}>Mise à jour...</Text>
                </View>
              ) : (
                <>
                  <PublicSwitch 
                    isPublic={outfit.isPublic !== false} 
                    onToggle={handlePublicToggle}
                    disabled={isUpdating}
                  />
                </>
              )}

              <View style={[styles.settingSeparator, { backgroundColor: colors.text.lighter }]} />
            </View>
          )}

          {outfit.clothes.length > 0 && <View style={styles.clothesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Vêtements</Text>
            {clothes.length > 0 && user && user.id !== outfit.user_id && (
              <View style={[styles.matchingSection, { backgroundColor: colors.gray }]}>
                <MatchingProgressBar percentage={matchingPercentage} />
              </View>
            )}
            {outfit.clothes.map((clothingItem : ClothingItem) => (
              <ClotheView key={clothingItem.id} clothingItem={clothingItem.clothe!} userWardrobeItems={clothes} showMatchStatus />
            ))}
          </View>}

          <View style={[styles.actionsContainer, { borderColor: colors.text.lighter }]}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={28} 
                color={liked ? colors.primary.main : colors.text.main} 
              />
              <Text style={[styles.actionText, { color: colors.text.main }]}>{likesCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.text.main} />
              <Text style={[styles.actionText, { color: colors.text.main }]}>{outfit?.comments.length || 0}</Text>
            </View>
          </View>

          <CommentsSection 
            outfitId={id as string}
            comments={outfit?.comments || []}
            currentUserId={user?.id}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
          />
        </ScrollView>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 15,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
  },
  outfitImageContainer: {
    height: 600,
    objectFit: 'contain',
  },
  outfitImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    padding: 20,
    paddingVertical: 5,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  metadataIcon: {
    marginRight: 5,
  },
  metadataText: {
    fontSize: 12,
  },
  settingsContainer: {
    paddingBottom: 10,
  },
  settingSeparator: {
    height: 1,
    marginVertical: 4,
  },
  genderSelectorContainer: {
    marginTop: 10,
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  clothesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsContainer: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    marginHorizontal: 10,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 16,
  },
  commentsSection: {
    padding: 20,
  },
  commentForm: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  commentButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
    justifyContent: 'center',
  },
  commentButtonText: {
    fontWeight: 'bold',
  },
  noComments: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  comment: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentDate: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  matchingSection: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
  },
}); 