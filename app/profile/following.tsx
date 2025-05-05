import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import * as FollowService from '@/services/followService';
import UserListItem from '@/components/UserListItem';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';

// Définir un type simplifié pour l'utilisateur
type UserProfile = {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  created_at?: string;
};

export default function FollowingScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const userId = (params.userId as string) || user?.id || '';
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userId) {
      fetchFollowing();
    }
  }, [userId]);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const followingData = await FollowService.fetchFollowing(userId);
      
      // Transformer les données pour correspondre au type UserProfile
      const formattedFollowing = followingData.map((userData: any) => ({
        id: userData.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        email: userData.email,
        created_at: userData.created_at
      }));
      
      setFollowing(formattedFollowing);
      
      // Si l'utilisateur est connecté, vérifier qui il suit parmi les personnes suivies
      if (user) {
        const followingMap: Record<string, boolean> = {};
        
        // Paralléliser les vérifications d'abonnement
        await Promise.all(
          formattedFollowing.map(async (followedUser) => {
            if (followedUser.id !== user.id) {
              const isFollowing = await FollowService.checkIfFollowing(user.id, followedUser.id);
              followingMap[followedUser.id] = isFollowing;
            }
          })
        );
        
        setFollowingMap(followingMap);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnements:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    setFollowingMap(prev => ({
      ...prev,
      [userId]: isFollowing
    }));
  };
  
  const renderItem = ({ item }: { item: UserProfile }) => (
    <UserListItem
      user={item}
      isFollowing={followingMap[item.id] || false}
      onFollowToggle={handleFollowToggle}
    />
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? colors.background.dark : '#eee' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.main} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.main }]}>{t('profile.idoles')}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.light }]}>
                {t('profile.noFollowing')}
              </Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 