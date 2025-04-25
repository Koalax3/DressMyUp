import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as FollowService from '@/services/followService';
import { ColorsTheme } from '@/constants/Colors';
import { DEFAULT_USER_AVATAR } from '@/constants/Users';

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
    <TouchableOpacity style={styles.container} onPress={handleUserPress}>
      <Image 
        source={{ uri: user.avatar_url || DEFAULT_USER_AVATAR }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        {user.bio && <Text style={styles.bio} numberOfLines={1}>{user.bio}</Text>}
      </View>
      {showFollowButton && !isCurrentUser && (
        <TouchableOpacity 
          style={[styles.followButton, following && styles.followingButton]} 
          onPress={handleFollowToggle}
          disabled={loading}
        >
          {loading ? (
            <Ionicons name="hourglass-outline" size={16} color={following ? "#666" : "#FFF"} />
          ) : (
            <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
              {following ? 'Abonné' : 'Suivre'}
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
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#F97A5C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  followingButton: {
    backgroundColor: ColorsTheme.background.main,
    borderWidth: 1,
    borderColor: ColorsTheme.primary.main,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  followingButtonText: {
    color: ColorsTheme.primary.main,
  },
});

export default UserListItem; 