import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Outfit, User } from '@/types';
import { OutfitService, UserService } from '@/services';
import OutfitPreview from '@/components/OutfitPreview';
import { useAuth } from '@/contexts/AuthContext';
import { ColorsTheme } from '@/constants/Colors';
import { DEFAULT_USER_AVATAR } from '@/constants/Users';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';

type SortOption = 'recent' | 'oldest' | 'popular';

type ProfileStats = {
  outfitsCount: number;
  likesCount: number;
  followersCount: number;
  followingCount: number;
};

type ProfileComponentProps = {
  userId: string;
  isCurrentUser: boolean;
  onBackPress?: () => void;
  hideLogoutButton?: boolean;
};

const ProfileComponent = ({ userId, isCurrentUser, onBackPress, hideLogoutButton }: ProfileComponentProps) => {
  const { user, updateProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [stats, setStats] = useState<ProfileStats>({
    outfitsCount: 0,
    likesCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchUserOutfits();
    }
  }, [userId, sortOption]);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      if (isCurrentUser && user) {
        // Si c'est l'utilisateur actuel, utiliser les données de l'utilisateur connecté
        setProfileUser(user);
      } else {
        // Récupérer les informations de l'utilisateur depuis userService
        const userData = await UserService.fetchUserProfile(userId);
        setProfileUser(userData);
      }

      // Récupérer les statistiques de l'utilisateur
      const userStats = await UserService.fetchUserStats(userId);
      setStats(prev => ({ 
        ...prev, 
        outfitsCount: userStats.outfitsCount,
        followersCount: userStats.followersCount,
        followingCount: userStats.followingCount 
      }));

      // Récupérer les tenues pour calculer le nombre total de likes
      const outfitsData = await OutfitService.fetchUserOutfits(userId);
      
      // Compter le nombre total de likes
      let totalLikes = 0;
      const outfitsWithDetails = await Promise.all(
        outfitsData.map(async (outfit) => {
          const likesCount = await OutfitService.counterLikes(outfit.id);
          totalLikes += likesCount || 0;
          return outfit;
        })
      );
      
      setStats(prev => ({ ...prev, likesCount: totalLikes }));

      // Vérifier si l'utilisateur courant suit cet utilisateur
      if (!isCurrentUser && user) {
        const following = await UserService.checkIfFollowing(user.id, userId);
        setIsFollowing(following);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOutfits = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Récupérer les tenues de l'utilisateur
      const outfitsData = await OutfitService.fetchUserOutfits(userId);
      
      // Tri des tenues selon l'option sélectionnée
      let sortedOutfits = [...outfitsData];

      switch (sortOption) {
        case 'recent':
          sortedOutfits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'oldest':
          sortedOutfits.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'popular':
          // Pour le tri par popularité, nous devons récupérer le nombre de likes
          const outfitsWithLikes = await Promise.all(
            sortedOutfits.map(async (outfit) => {
              const likesCount = await OutfitService.counterLikes(outfit.id);
              return { ...outfit, likesCount };
            })
          );
          sortedOutfits = outfitsWithLikes.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
          break;
      }

      setOutfits(sortedOutfits);
    } catch (error) {
      console.error('Erreur lors de la récupération des tenues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        }},
      ]
    );
  };

  const toggleFollow = async () => {
    if (!user || !profileUser) return;
    
    try {
      // Appeler le service pour suivre/ne plus suivre l'utilisateur
      const result = await UserService.toggleFollow(user.id, profileUser.id);
      
      // Mettre à jour l'état local
      setIsFollowing(result);
      
      // Mettre à jour les statistiques
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + (result ? 1 : -1)
      }));
    } catch (error) {
      console.error('Erreur lors du suivi/désabonnement:', error);
      Alert.alert(t('errors.generic'), t('errors.tryAgain'));
    }
  };

  const pickAvatar = async () => {
    if (!isCurrentUser) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      uploadAvatar(result.assets[0].base64);
    }
  };

  const uploadAvatar = async (base64Image: string) => {
    if (!user) return;

    try {
      setUploadingAvatar(true);
      
      // Utiliser le service pour télécharger l'avatar
      const avatarUrl = await UserService.uploadAvatar(user.id, base64Image);
      
      // Mettre à jour le profil utilisateur
      await updateProfile({ avatar_url: avatarUrl });
      
      // Mettre à jour l'état local si nécessaire
      if (isCurrentUser && profileUser) {
        setProfileUser({
          ...profileUser,
          avatar_url: avatarUrl
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('errors.generic'), t('errors.uploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const renderOutfitItem = ({ item }: { item: Outfit }) => {
    // S'assurer que l'outfit a un utilisateur
    if (!item.user) {
      item.user = profileUser as User;
    }
    return <OutfitPreview outfit={item} />;
  };

  if (loading && !profileUser && !outfits.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97A5C" />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('profile.userNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      {onBackPress && <View style={styles.header}>
          <TouchableOpacity onPress={onBackPress}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        {isCurrentUser && !hideLogoutButton && (
          <TouchableOpacity onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>}

      <FlatList
        data={outfits}
        renderItem={renderOutfitItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.outfitList}
        ListHeaderComponent={() => (
          <>
            <View style={styles.profileHeader}>
              <TouchableOpacity 
                style={styles.avatarContainer} 
                onPress={pickAvatar} 
                disabled={uploadingAvatar || !isCurrentUser}
              >
                {uploadingAvatar ? (
                  <View style={styles.avatar}>
                    <ActivityIndicator color={colors.text.main} />
                  </View>
                ) : (
                  <Image 
                    source={{ uri: profileUser.avatar_url || DEFAULT_USER_AVATAR }} 
                    style={styles.avatar}
                  />
                )}
                {isCurrentUser && (
                  <View style={styles.editAvatarIcon}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={[styles.username, { color: colors.text.main }]}>
                  {profileUser.username}
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text.main }]}>
                      {stats.outfitsCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text.light }]}>
                      {t('profile.outfits')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text.main }]}>
                      {stats.likesCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text.light }]}>
                      {t('profile.likes')}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.statItem, styles.clickableStatItem]}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/profile/followers',
                      params: { userId: userId }
                    })}
                  >
                    <Text style={[styles.statValue, { color: colors.text.main }]}>
                      {stats.followersCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text.light }]}>
                      {t('profile.fans')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statItem, styles.clickableStatItem]}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/profile/following',
                      params: { userId: userId }
                    })}
                  >
                    <Text style={[styles.statValue, { color: colors.text.main }]}>
                      {stats.followingCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.text.light }]}>
                      {t('profile.idoles')}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {profileUser.bio && (
                  <Text style={[styles.bio, { color: colors.text.light }]}>
                    {profileUser.bio}
                  </Text>
                )}
                
                {!isCurrentUser && (
                  <TouchableOpacity 
                    style={[
                      styles.followButton,
                      isFollowing && styles.followingButton,
                      { borderColor: colors.primary.main }
                    ]}
                    onPress={toggleFollow}
                  >
                    <Text 
                      style={[
                        styles.followButtonText,
                        isFollowing && styles.followingButtonText,
                        { color: isFollowing ? colors.primary.main : colors.text.bright }
                      ]}
                    >
                      {isFollowing ? t('profile.following') : t('profile.follow')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.sortContainer, { borderColor: colors.gray }]}>
              <TouchableOpacity 
                style={[
                  styles.sortButton, 
                  sortOption === 'recent' && styles.activeSortButton,
                  sortOption === 'recent' && { backgroundColor: isDarkMode ? colors.primary.main : colors.secondary.main }
                ]}
                onPress={() => setSortOption('recent')}
              >
                <Text 
                  style={[
                    styles.sortButtonText, 
                    { color: colors.text.main },
                    sortOption === 'recent' && styles.activeSortButtonText,
                    sortOption === 'recent' && { color: colors.white }
                  ]}
                >
                  {t('profile.recent')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sortButton, 
                  sortOption === 'popular' && styles.activeSortButton,
                  sortOption === 'popular' && { backgroundColor: isDarkMode ? colors.primary.main : colors.secondary.main }
                ]}
                onPress={() => setSortOption('popular')}
              >
                <Text 
                  style={[
                    styles.sortButtonText, 
                    { color: colors.text.main },
                    sortOption === 'popular' && styles.activeSortButtonText,
                    sortOption === 'popular' && { color: colors.white }
                  ]}
                >
                  {t('profile.popular')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.sortButton, 
                  sortOption === 'oldest' && { backgroundColor: isDarkMode ? colors.primary.main : colors.secondary.main }
                ]}
                onPress={() => setSortOption('oldest')}
              >
                <Text 
                  style={[
                    styles.sortButtonText, 
                    { color: colors.text.main },
                    sortOption === 'oldest' && styles.activeSortButtonText,
                    sortOption === 'oldest' && { color: colors.white }
                  ]}
                >
                  {t('profile.oldest')}
                </Text>
              </TouchableOpacity>
            </View>
            
            {outfits.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.text.main }]}>
                  {isCurrentUser ? t('profile.noOutfits') : t('profile.noOutfitsUser')}
                </Text>
                {isCurrentUser && (
                  <TouchableOpacity 
                    style={[styles.createButton, { backgroundColor: colors.primary.main }]}
                    onPress={() => router.push('/outfit/create')}
                  >
                    <Text style={styles.createButtonText}>{t('profile.createOutfit')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
        ListEmptyComponent={loading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        ) : null}
        refreshing={loading}
        onRefresh={() => {
          fetchUserData();
          fetchUserOutfits();
        }}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={() => {
              fetchUserData();
              fetchUserOutfits();
            }}
            colors={[colors.primary.main]} 
            tintColor={colors.primary.main}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    backgroundColor: '#F97A5C',
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  followButton: {
    backgroundColor: ColorsTheme.primary.main,
    paddingVertical: 7,
    borderRadius: 4,
    marginTop: 12,
    width: '100%',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  followButtonText: {
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  followingButtonText: {
    color: ColorsTheme.primary.main,
  },
  tabContainer: {
    display: 'none',
  },
  tabButton: {
    display: 'none',
  },
  activeTabButton: {
    display: 'none',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    width: '33%',
    marginHorizontal: 2,
  },
  activeSortButton: {
    // Style dynamique appliqué dans le rendu
  },
  sortButtonText: {
    textAlign: 'center',
    fontSize: 12,
  },
  activeSortButtonText: {
    fontWeight: 'bold',
  },
  clickableStatItem: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  outfitList: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
  },
});

export default ProfileComponent; 