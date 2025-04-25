import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/constants/Supabase';
import { Swipeable } from 'react-native-gesture-handler';
import { ColorsTheme } from '@/constants/Colors';
import { DEFAULT_USER_AVATAR } from '@/constants/Users';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

interface CommentsSectionProps {
  outfitId: string;
  comments: (Comment & { user: User })[];
  currentUserId?: string;
  onCommentAdded: (comment: Comment & { user: User }) => void;
  onCommentDeleted: (commentId: string) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  outfitId,
  comments,
  currentUserId,
  onCommentAdded,
  onCommentDeleted
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const addComment = async () => {
    if (!commentText.trim() || !user) return;
    
    setCommenting(true);
    
    try {
      // Première étape : ajouter le commentaire
      const { data: newComment, error: insertError } = await supabase
        .from('comments')
        .insert({
          outfit_id: outfitId,
          user_id: user.id,
          content: commentText.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Deuxième étape : récupérer les infos utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      if (newComment && userData) {
        setCommentText('');
        // Combiner le commentaire et les données utilisateur
        const commentWithUser = {
          ...newComment,
          user: userData
        };
        onCommentAdded(commentWithUser as unknown as Comment & { user: User });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter votre commentaire. Veuillez réessayer.');
    } finally {
      setCommenting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (deleting) return;
    
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      onCommentDeleted(commentId);
      
      // Fermer le swipeable si nécessaire
      const swipeable = swipeableRefs.current.get(commentId);
      if (swipeable) {
        swipeable.close();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      Alert.alert('Erreur', 'Impossible de supprimer ce commentaire. Veuillez réessayer.');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        { text: 'Annuler', style: 'cancel', onPress: () => {
          // Fermer le swipeable si l'utilisateur annule
          const swipeable = swipeableRefs.current.get(commentId);
          if (swipeable) {
            swipeable.close();
          }
        }},
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteComment(commentId) }
      ]
    );
  };
  
  const renderRightActions = (commentId: string, isOwner: boolean) => {
    if (!isOwner) return null;
    
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity 
          style={[styles.deleteAction, { backgroundColor: colors.primary.main, borderColor: colors.background.main }]}
          onPress={() => confirmDeleteComment(commentId)}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.text.bright} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={colors.text.bright} />
              <Text style={[styles.deleteActionText, { color: colors.text.bright }]}>Supprimer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Commentaires</Text>
      
      {user && (
        <View style={styles.commentForm}>
          <TextInput
            ref={commentInputRef}
            style={[styles.commentInput, { 
              backgroundColor: colors.background.deep,
              color: colors.text.main
            }]}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={colors.text.light}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.commentButton, 
              { backgroundColor: colors.primary.main },
              (!commentText.trim() || commenting) && [styles.disabledButton, { backgroundColor: colors.text.light }]
            ]} 
            onPress={addComment}
            disabled={!commentText.trim() || commenting}
          >
            {commenting ? (
              <ActivityIndicator size="small" color={colors.text.bright} />
            ) : (
              <Text style={[styles.commentButtonText, { color: colors.text.bright }]}>Envoyer</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {comments.length === 0 ? (
        <Text style={[styles.noComments, { color: colors.text.light }]}>Aucun commentaire pour le moment.</Text>
      ) : (
        comments.map((comment) => {
          const isOwner = currentUserId === comment.user_id;
          
          return (
            <Swipeable
              key={comment.id}
              ref={(ref) => {
                if (ref && isOwner) {
                  swipeableRefs.current.set(comment.id, ref);
                }
              }}
              renderRightActions={() => renderRightActions(comment.id, isOwner)}
              overshootRight={false}
              friction={2}
              rightThreshold={width / 3}
            >
              <View style={[styles.comment, { 
                backgroundColor: colors.background.deep,
                borderColor: colors.background.main
              }]}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUser}>
                    <Image 
                      source={{ uri: comment.user.avatar_url || DEFAULT_USER_AVATAR }} 
                      style={styles.commentAvatar} 
                    />
                    <Text style={[styles.commentUsername, { color: colors.text.main }]}>{comment.user.username}</Text>
                  </View>
                  <Text style={[styles.commentDate, { color: colors.text.light }]}>{formatDate(comment.created_at)}</Text>
                </View>
                <Text style={[styles.commentContent, { color: colors.text.main }]}>{comment.content}</Text>
                {isOwner && (
                  <Text style={[styles.swipeHint, { color: colors.text.light }]}>Glisser vers la gauche pour accéder aux options</Text>
                )}
              </View>
            </Swipeable>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
    alignItems: 'center',
    minWidth: 80,
  },
  disabledButton: {
    opacity: 0.7,
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
    borderRadius: 10,
    borderWidth: 2,
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
  swipeActions: {
    height: '100%',
    justifyContent: 'center',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderRadius: 10,
    borderWidth: 2,
  },
  deleteActionText: {
    fontSize: 12,
    marginTop: 4,
  },
  swipeHint: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default CommentsSection; 