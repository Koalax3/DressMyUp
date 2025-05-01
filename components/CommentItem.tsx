import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, User } from '@/types';
import { deleteComment } from '@/services/outfitService';
import { router } from 'expo-router';
import { ColorsTheme } from '@/constants/Colors';
import { DEFAULT_USER_AVATAR } from '@/constants/Users';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';

interface CommentItemProps {
  comment: Comment & { user: User };
  currentUserId?: string | null;
  outfitId: string;
  onCommentDeleted: (commentId: string) => void;
}

const CommentItem = ({ comment, currentUserId, outfitId, onCommentDeleted }: CommentItemProps) => {
  const [deleting, setDeleting] = React.useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleDeleteComment = () => {
    Alert.alert(
      t('comments.deleteComment'),
      t('comments.deleteCommentConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: confirmDeleteComment }
      ]
    );
  };

  const confirmDeleteComment = async () => {
    if (!currentUserId) return;
    
    setDeleting(true);
    try {
      const success = await deleteComment(comment.id, currentUserId);
      if (success) {
        onCommentDeleted(comment.id);
      } else {
        Alert.alert(t('errors.generic'), t('errors.commentDeleteFailed'));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      Alert.alert(t('errors.generic'), t('errors.tryAgain'));
    } finally {
      setDeleting(false);
    }
  };

  const handleUserPress = () => {
    if (comment.user.id === currentUserId) {
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/profile/[id]',
        params: { id: comment.user.id }
      });
    }
  };

  const isOwner = currentUserId === comment.user_id;

  return (
    <View style={[styles.comment, { backgroundColor: colors.background.deep }]}>
      <View style={styles.commentHeader}>
        <TouchableOpacity style={styles.commentUser} onPress={handleUserPress}>
          <Image 
            source={{ uri: comment.user.avatar_url || DEFAULT_USER_AVATAR }} 
            style={styles.commentAvatar} 
          />
          <Text style={[styles.commentUsername, { color: colors.text.main }]}>{comment.user.username}</Text>
        </TouchableOpacity>
        <View style={styles.commentActions}>
          <Text style={[styles.commentDate, { color: colors.text.light }]}>{formatDate(comment.created_at)}</Text>
          {isOwner && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteComment}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : (
                <Ionicons name="trash-outline" size={18} color={colors.primary.main} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={[styles.commentContent, { color: colors.text.main }]}>{comment.content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentDate: {
    fontSize: 12,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CommentItem; 