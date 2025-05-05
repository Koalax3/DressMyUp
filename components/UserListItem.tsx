import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as FollowService from '@/services/followService';
import { getThemeColors } from '@/constants/Colors';
import { DEFAULT_USER_AVATAR } from '@/constants/Users';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n/useTranslation';

type UserListItemProps = {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
  };
  isFollowing: boolean;
  showFollowButton?: boolean;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
};

const UserListItem = ({ 
  user, 
  isFollowing, 
  showFollowButton = true,
  onFollowToggle 
}: UserListItemProps) => {
  const { user: currentUser } = useAuth();
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  const handleUserPress = () => {
    if (user.id === currentUser?.id) {
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/profile/[id]',
        params: { id: user.id }
      });
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || loading) return;
    
    setLoading(true);
    try {
      const result = await FollowService.toggleFollow(currentUser.id, user.id);
      setFollowing(result);
      if (onFollowToggle) {
        onFollowToggle(user.id, result);
      }
    } catch (error) {
      console.error('Erreur lors de la modification de l\'abonnement:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUser = user.id === currentUser?.id;

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        {
          borderBottomColor: isDarkMode ? colors.background.dark : '#f0f0f0',
          backgroundColor: colors.background.main
        }
      ]} 
      onPress={handleUserPress}
    >
      <Image 
        source={{ uri: user.avatar_url || DEFAULT_USER_AVATAR }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: colors.text.main }]}>{user.username}</Text>
        {user.bio && <Text style={[styles.bio, { color: colors.text.light }]} numberOfLines={1}>{user.bio}</Text>}
      </View>
      {showFollowButton && !isCurrentUser && (
        <TouchableOpacity 
          style={[
            styles.followButton, 
            { backgroundColor: following ? 'transparent' : colors.primary.main },
            following && { borderColor: colors.primary.main, borderWidth: 1 }
          ]} 
          onPress={handleFollowToggle}
          disabled={loading}
        >
          {loading ? (
            <Ionicons name="hourglass-outline" size={16} color={following ? colors.text.light : colors.white} />
          ) : (
            <Text style={[
              styles.followButtonText, 
              { color: following ? colors.primary.main : colors.white }
            ]}>
              {following ? t('profile.following') : t('profile.follow')}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  bio: {
    fontSize: 14,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  followButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default UserListItem; 