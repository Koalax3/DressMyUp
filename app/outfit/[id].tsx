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
import GenderSelector from '@/components/GenderSelector';
import { genders } from '@/constants/Outfits';
import { Outfit, User, ClothingItem, Comment } from '@/types';
import { ColorsTheme } from '@/constants/Colors';
import MatchingProgressBar from '@/components/MatchingProgressBar';
import { calculateMatchingPercentage } from '@/services/matchingService';
import { supabase } from '@/constants/Supabase';

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
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [matchingPercentage, setMatchingPercentage] = useState(0);
  const [userWardrobe, setUserWardrobe] = useState<ClothingItem[]>([]);
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (id) {
      fetchOutfitDetails();
      checkIfLiked();
      fetchLikesCount();
      fetchUserWardrobe();
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

  const addComment = async () => {
    if (!user || !id || !outfit || !commentText.trim()) return;

    setCommenting(true);

    try {
      const newComment = await OutfitService.addCommentToOutfit(
        user.id,
        id as string,
        commentText.trim()
      );

      if (newComment) {
        setOutfit({
          ...outfit,
          comments: [newComment, ...outfit.comments],
        });
        setCommentText('');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    } finally {
      setCommenting(false);
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

  const fetchUserWardrobe = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setUserWardrobe(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de la garde-robe:', error);
    }
  };

  useEffect(() => {
    if (outfit && userWardrobe.length > 0) {
      const percentage = calculateMatchingPercentage(outfit, userWardrobe);
      setMatchingPercentage(percentage);
    }
  }, [outfit, userWardrobe]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97A5C" />
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Tenue introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOwner = user && user.id === outfit.user_id;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{outfit.name}</Text>
          <View >
          <TouchableOpacity onPress={shareOutfit} style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color={ColorsTheme.secondary.dark} />
            </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color="#F97A5C" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#F97A5C" />
              )}
            </TouchableOpacity>
          )}
          </View>
        </View>

        <View style={styles.userInfo}>
          <TouchableOpacity 
            style={styles.userContainer}
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
          <Text style={styles.date}>{formatDate(outfit.created_at)}</Text>
        </View>

        {outfit.image_url && (
          <View style={styles.outfitImageContainer}>
            <Image 
              source={{ uri: outfit.image_url }} 
              style={styles.outfitImage}
              resizeMode="cover"
            />
          </View>
        )}

        {outfit.description && (
          <Text style={styles.description}>{outfit.description}</Text>
        )}
        
        <View style={styles.metadataContainer}>
          {outfit.season && (
            <View style={styles.metadataItem}>
              <Ionicons name="sunny-outline" size={20} color={ColorsTheme.primary.main} style={styles.metadataIcon} />
              <Text style={styles.metadataText}>
                {outfit.season === 'summer' ? 'Été' : 
                 outfit.season === 'winter' ? 'Hiver' : 
                 outfit.season === 'spring' ? 'Printemps' : 
                 outfit.season === 'fall' ? 'Automne' : outfit.season}
              </Text>
            </View>
          )}
          
          {outfit.occasion && (
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={20} color={ColorsTheme.primary.main} style={styles.metadataIcon} />
              <Text style={styles.metadataText}>
                {outfit.occasion === 'casual' ? 'Casual' :
                 outfit.occasion === 'formal' ? 'Formel' :
                 outfit.occasion === 'sport' ? 'Sport' :
                 outfit.occasion === 'work' ? 'Travail' :
                 outfit.occasion === 'party' ? 'Soirée' : outfit.occasion}
              </Text>
            </View>
          )}
          
          {outfit.gender && (
            <View style={styles.metadataItem}>
              <Ionicons 
                name={
                  outfit.gender === 'male' ? 'male-outline' :
                  outfit.gender === 'female' ? 'female-outline' :
                  'people-outline'
                } 
                size={20} 
                color={ColorsTheme.primary.main} 
                style={styles.metadataIcon} 
              />
              <Text style={styles.metadataText}>
                {genders[outfit.gender] || outfit.gender}
              </Text>
            </View>
          )}
        </View>

        {/* Paramètres de l'outfit (uniquement pour le propriétaire) */}
        {isOwner && (
          <View style={styles.settingsContainer}>
            <View style={styles.settingSeparator} />
            
            {isUpdating ? (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color="#F97A5C" />
                <Text style={styles.loadingText}>Mise à jour...</Text>
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

            <View style={styles.settingSeparator} />
          </View>
        )}

        <View style={styles.clothesContainer}>
          <Text style={styles.sectionTitle}>Vêtements</Text>
          {userWardrobe.length > 0 && (
            <View style={styles.matchingSection}>
              <MatchingProgressBar percentage={matchingPercentage} />
            </View>
          )}
          {outfit.clothes.map((clothingItem : ClothingItem) => (
            <ClotheView key={clothingItem.id} clothingItem={clothingItem.clothe!} userWardrobeItems={userWardrobe} showMatchStatus />
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLike}
          >
            <Ionicons 
              name={liked ? "heart" : "heart-outline"} 
              size={28} 
              color={liked ? "#F97A5C" : "#333"} 
            />
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => commentInputRef.current?.focus()}>
            <Ionicons name="chatbubble-outline" size={24} color="#333" />
            <Text style={styles.actionText}>{outfit.comments.length}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Commentaires</Text>
          
          {user && (
            <View style={styles.commentForm}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder="Ajouter un commentaire..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity 
                style={styles.commentButton} 
                onPress={addComment}
                disabled={!commentText.trim() || commenting}
              >
                {commenting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.commentButtonText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {outfit.comments.length === 0 ? (
            <Text style={styles.noComments}>Aucun commentaire pour le moment.</Text>
          ) : (
            outfit.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUser}>
                    <Image 
                      source={{ uri: comment.user.avatar_url }} 
                      style={styles.commentAvatar} 
                    />
                    <Text style={styles.commentUsername}>{comment.user.username}</Text>
                  </View>
                  <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorsTheme.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorsTheme.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ColorsTheme.white,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: ColorsTheme.text.main,
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
    color: ColorsTheme.text.main,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: ColorsTheme.text.main,
  },
  date: {
    fontSize: 14,
    color: ColorsTheme.text.main,
  },
  outfitImageContainer: {
    height: 600,
    objectFit: 'contain',
    marginBottom: 20,
  },
  outfitImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    padding: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 0,
    paddingBottom: 10,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ColorsTheme.gray,
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
    fontSize: 14,
    color: ColorsTheme.text.main,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  settingSeparator: {
    height: 1,
    backgroundColor: ColorsTheme.background.main,
    marginVertical: 10,
  },
  genderSelectorContainer: {
    marginTop: 10,
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: ColorsTheme.text.main,
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
    color: ColorsTheme.text.main,
  },
  clothesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ColorsTheme.text.main,
    marginBottom: 15,
  },
  actionsContainer: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    marginHorizontal: 10,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 16,
    color: ColorsTheme.text.main,
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
    backgroundColor: ColorsTheme.gray,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  commentButton: {
    backgroundColor: ColorsTheme.primary.main,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
    justifyContent: 'center',
  },
  commentButtonText: {
    color: ColorsTheme.background.main,
    fontWeight: 'bold',
  },
  noComments: {
    fontSize: 14,
    color: ColorsTheme.text.main,
    textAlign: 'center',
    paddingVertical: 20,
  },
  comment: {
    marginBottom: 20,
    backgroundColor: ColorsTheme.gray,
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
    color: ColorsTheme.text.main,
  },
  commentDate: {
    fontSize: 12,
    color: ColorsTheme.text.main,
  },
  commentContent: {
    fontSize: 14,
    color: ColorsTheme.text.main,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#F97A5C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: ColorsTheme.background.main,
    fontWeight: 'bold',
    fontSize: 16,
  },
  matchingSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
}); 