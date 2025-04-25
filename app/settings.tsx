import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorsTheme, DarkColorsTheme } from '@/constants/Colors';

type SettingItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
  destructive?: boolean;
  rightComponent?: React.ReactNode;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Utiliser le thème approprié en fonction du mode
  const colors = isDarkMode ? DarkColorsTheme : ColorsTheme;

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive', 
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  const navigateToEditProfile = () => {
    router.push('/profile/edit');
  };

  const navigateToPreferredStyles = () => {
    router.push('/settings/preferred-styles');
  };

  const settings: SettingItem[] = [
    {
      id: 'edit_profile',
      title: 'Éditer mon profil',
      icon: 'person-outline',
      onPress: navigateToEditProfile
    },
    {
      id: 'preferred_styles',
      title: 'Styles préférés',
      icon: 'heart-outline',
      onPress: navigateToPreferredStyles
    },
    {
      id: 'dark_mode',
      title: 'Mode sombre',
      icon: 'moon-outline',
      onPress: toggleTheme,
      rightComponent: (
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: colors.primary.light }}
          thumbColor={isDarkMode ? colors.primary.main : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      )
    },
    {
      id: 'logout',
      title: 'Déconnexion',
      icon: 'log-out-outline',
      iconColor: '#FF3B30',
      onPress: handleSignOut,
      destructive: true
    }
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        { backgroundColor: isDarkMode ? colors.background.deep : '#fff', 
          borderBottomColor: isDarkMode ? colors.background.dark : '#f0f0f0' }
      ]}
      onPress={item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons 
          name={item.icon} 
          size={22} 
          color={item.iconColor || (isDarkMode ? colors.text.main : ColorsTheme.text.main)} 
          style={styles.settingIcon} 
        />
        <Text style={[
          styles.settingTitle,
          { color: isDarkMode ? colors.text.main : ColorsTheme.text.main },
          item.destructive && styles.destructiveText
        ]}>
          {item.title}
        </Text>
      </View>
      {item.rightComponent || (
        <Ionicons name="chevron-forward" size={18} color={isDarkMode ? colors.text.light : "#ACACAC"} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? colors.background.main : '#fff' }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? colors.background.dark : '#f0f0f0' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? colors.text.main : "#333"} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkMode ? colors.text.main : "#333" }]}>Paramètres</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.text.light : "#999" }]}>Compte</Text>
          {settings.slice(0, 1).map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.text.light : "#999" }]}>Préférences</Text>
          {settings.slice(1, 3).map(renderSettingItem)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.text.light : "#999" }]}>Système</Text>
          {settings.slice(3).map(renderSettingItem)}
        </View>
      </ScrollView>
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
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
  },
  destructiveText: {
    color: '#FF3B30',
  },
}); 