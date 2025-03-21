import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { OutfitService, OutfitWithDetails } from '../../services';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [outfit, setOutfit] = useState<OutfitWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOutfitDetails();
      checkIfLiked();
    }
  }, [id, user]);

  const fetchOutfitDetails = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const outfitDetails = await OutfitService.fetchOutfitDetails(id as string);
      setOutfit(outfitDetails);
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
      setOutfit({
        ...outfit,
        likes_count: isNowLiked ? outfit.likes_count + 1 : outfit.likes_count - 1,
      });
    } catch (error) {
      console.error('Erreur lors du like/unlike:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
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
          comments_count: outfit.comments_count + 1,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{outfit.name}</Text>
          {user && user.id === outfit.user_id ? (
            <TouchableOpacity onPress={handleDelete} disabled={deleting}>
              {deleting ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
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

        <View style={styles.clothesContainer}>
          <Text style={styles.sectionTitle}>Vêtements</Text>
          {outfit.clothes.map((clothingItem) => (
            <TouchableOpacity 
              key={clothingItem.id} 
              style={styles.clothingItem}
              onPress={() => router.push({
                pathname: '/clothing/[id]',
                params: { id: clothingItem.id }
              })}
            >
              <Image source={{ uri: clothingItem.image_url }} style={styles.clothingImage} />
              <View style={styles.clothingInfo}>
                <Text style={styles.clothingName}>{clothingItem.name}</Text>
                <Text style={styles.clothingType}>{clothingItem.type}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
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
              color={liked ? "#FF6B6B" : "#333"} 
            />
            <Text style={styles.actionText}>{outfit.likes_count}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#333" />
            <Text style={styles.actionText}>{outfit.comments_count}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Commentaires</Text>
          
          {user && (
            <View style={styles.commentForm}>
              <TextInput
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
                      source={{ uri: comment.user.avatar_url || 'https://via.placeholder.com/40' }} 
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
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
    color: '#333',
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
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#999',
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
  clothesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  clothingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  clothingImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 15,
  },
  clothingInfo: {
    flex: 1,
  },
  clothingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  clothingType: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  commentButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
    justifyContent: 'center',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  comment: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
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
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 