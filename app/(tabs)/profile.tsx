import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import ProfileComponent from '@/components/ProfileComponent';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import Header from '@/components/Header';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  const navigateToSettings = () => {
    router.push('/settings');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title="Profil" >
        <TouchableOpacity onPress={navigateToSettings}>
          <Ionicons name="settings-outline" size={24} color={colors.text.main} />
        </TouchableOpacity>
      </Header>
      <ProfileComponent
        userId={user.id}
        isCurrentUser={true}
        hideLogoutButton={true}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 5,
  },
});