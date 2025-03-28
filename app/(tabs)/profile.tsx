import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Outfit, User } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({
    outfitsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [activeTab, setActiveTab] = useState<'outfits' | 'likes'>('outfits');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Utiliser useFocusEffect pour recharger les données quand l'écran redevient actif
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchUserData();
      }
    }, [user])
  );

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Récupérer les tenues de l'utilisateur
      const { data: outfitsData, error: outfitsError } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (outfitsError) {
        console.error('Erreur lors de la récupération des tenues:', outfitsError);
      } else {
        setOutfits(outfitsData || []);
        setStats(prev => ({ ...prev, outfitsCount: outfitsData?.length || 0 }));
      }

      // Récupérer le nombre d'abonnés
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Erreur lors de la récupération des abonnés:', followersError);
      } else {
        setStats(prev => ({ ...prev, followersCount: followersCount || 0 }));
      }

      // Récupérer le nombre d'abonnements
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Erreur lors de la récupération des abonnements:', followingError);
      } else {
        setStats(prev => ({ ...prev, followingCount: followingCount || 0 }));
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const pickAvatar = async () => {
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
      
      const fileName = `avatars/${user.id}/${Date.now()}.jpg`;
      const contentType = 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, decode(base64Image), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert('Erreur', 'Impossible de télécharger l\'image. Veuillez réessayer.');
        console.error('Erreur lors du téléchargement de l\'avatar:', uploadError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const { error: updateError } = await updateProfile({
        avatar_url: urlData.publicUrl,
      });

      if (updateError) {
        Alert.alert('Erreur', 'Impossible de mettre à jour votre profil. Veuillez réessayer.');
        console.error('Erreur lors de la mise à jour du profil:', updateError);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const renderOutfitItem = ({ item }: { item: Outfit }) => (
    <TouchableOpacity 
      style={styles.outfitItem}
      onPress={() => router.push({
        pathname: '/outfit/[id]',
        params: { id: item.id }
      })}
    >
      <View style={styles.outfitCard}>
        <Text style={styles.outfitName}>{item.name}</Text>
        <View style={styles.outfitStats}>
          <View style={styles.outfitStat}>
            <Ionicons name="heart" size={16} color="#F97A5C" />
            <Text style={styles.outfitStatText}>{item.likes_count}</Text>
          </View>
          <View style={styles.outfitStat}>
            <Ionicons name="chatbubble" size={16} color="#666" />
            <Text style={styles.outfitStatText}>{item.comments_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97A5C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <Image 
                source={{ uri: user.avatar_url || 'https://via.placeholder.com/100' }} 
                style={styles.avatar}
              />
            )}
            <View style={styles.editAvatarIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{user.username}</Text>
          {<Text style={styles.bio}>{user.bio}</Text>}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.outfitsCount}</Text>
              <Text style={styles.statLabel}>Tenues</Text>
            </View>
            {/* <TouchableOpacity style={styles.statItem} onPress={() => router.push('/followers')}>
              <Text style={styles.statValue}>{stats.followersCount}</Text>
              <Text style={styles.statLabel}>Fans</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/following')}>
              <Text style={styles.statValue}>{stats.followingCount}</Text>
              <Text style={styles.statLabel}>Idoles</Text>
            </TouchableOpacity> */}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#F97A5C',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  editProfileButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F97A5C',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#F97A5C',
    fontWeight: 'bold',
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
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#F97A5C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  outfitList: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
  },
  outfitItem: {
    width: '48%',
    marginBottom: 15,
  },
  outfitCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    height: 100,
    justifyContent: 'space-between',
  },
  outfitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  outfitStats: {
    flexDirection: 'row',
  },
  outfitStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  outfitStatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
}); 