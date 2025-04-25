import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ProfileComponent from '@/components/ProfileComponent';
import { useAuth } from '@/contexts/AuthContext';

export default function UserProfileScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const userId = params.id as string;
  const isCurrentUser = userId === user?.id;

  const handleBackPress = () => {
    router.back();
  };

  // Si c'est le profil de l'utilisateur connecté, rediriger vers l'onglet profil
  if (isCurrentUser) {
    router.replace('/(tabs)/profile');
    return null;
  }

  if (!userId) {
    // Rediriger vers la page de profil utilisateur connecté si aucun id n'est fourni
    router.replace('/(tabs)/profile');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfileComponent
        userId={userId}
        isCurrentUser={isCurrentUser}
        onBackPress={handleBackPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 