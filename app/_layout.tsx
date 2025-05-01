import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { ScrollProvider } from '../contexts/ScrollContext';
import { FilterProvider } from '../contexts/FilterContext';
import { ClothingProvider } from '@/contexts/ClothingContext';
import { OutfitProvider } from '@/contexts/OutfitContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import toastConfig from '../components/toastConfig';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/i18n/i18n';
import { ColorsTheme } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ColorsTheme.primary.main} />
      </View>
    );
  }
  
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <CustomThemeProvider>
            <ClothingProvider>
              <OutfitProvider>
                <ScrollProvider>
                  <FilterProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                      </Stack>
                      <Toast config={toastConfig} />
                    </GestureHandlerRootView>
                  </FilterProvider>
                </ScrollProvider>
              </OutfitProvider>
            </ClothingProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
} 