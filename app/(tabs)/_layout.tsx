import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Slot, useRootNavigationState, router } from 'expo-router';
import { ColorsTheme, getThemeColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n/useTranslation';

/**
 * Vous pouvez explorer la documentation intégrée d'Expo Router:
 * https://expo.github.io/router/docs
 */

export default function TabLayout() {
  const rootNavigationState = useRootNavigationState();
  let auth;
  
  try {
    // Essayer d'accéder au contexte d'authentification
    auth = useAuth();
  } catch (error) {
    // En cas d'erreur, retourner un Slot vide
    return <Slot />;
  }
  
  const { user, loading } = auth;
  const [isNavigating, setIsNavigating] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!rootNavigationState?.key) return;
    
    // Attendre un court délai pour s'assurer que le composant est monté
    const timer = setTimeout(() => {
      if (!loading && !user && !isNavigating) {
        setIsNavigating(true);
        
        // Utiliser requestAnimationFrame pour s'assurer que le navigateur a fini son rendu
        requestAnimationFrame(() => {
          router.replace('/auth/login');
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, loading, isNavigating, rootNavigationState?.key]);

  // Afficher un indicateur de chargement pendant le chargement
  if (loading || !rootNavigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ColorsTheme.primary.main} />
      </View>
    );
  }

  // Si l'utilisateur n'est pas connecté, retourner un Slot vide pour permettre à la navigation de se produire
  if (!user) {
    return <Slot />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ColorsTheme.primary.main,
        tabBarInactiveTintColor: isDarkMode ? colors.secondary.light : ColorsTheme.secondary.main,
        tabBarStyle: { paddingBottom: 5, height: 60, backgroundColor: isDarkMode ? colors.background.deep : ColorsTheme.background.main, borderTopWidth: 0 },
        tabBarLabelStyle: { fontSize: 12 },
        headerShown: false,
      }}>
      {/* <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.wardrobe'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="hanger" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('navigation.create'),
          tabBarIcon: ({ color }) => <FontAwesome name="plus-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('navigation.explore'),
          tabBarIcon: ({ color }) => <FontAwesome name="compass" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
} 