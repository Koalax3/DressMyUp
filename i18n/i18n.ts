import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// Importation des ressources de traduction
import fr from './locales/fr.json';
import en from './locales/en.json';

// Ressources de traduction
const resources = {
  fr: {
    translation: fr
  },
  en: {
    translation: en
  }
};

// Fonction pour détecter la langue du système sans utiliser react-native-localize
const detectUserLanguage = (): string => {
  try {
    // Méthode alternative pour obtenir la langue du système
    let deviceLanguage: string | undefined;
    
    if (Platform.OS === 'ios') {
      // @ts-ignore - Les types peuvent ne pas être précis pour ce cas d'utilisation
      deviceLanguage = NativeModules.SettingsManager?.settings?.AppleLocale || 
                      // @ts-ignore
                      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0];
    } else {
      // @ts-ignore
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier;
    }

    // Extraire le code de langue (par exemple 'fr' depuis 'fr_FR')
    const languageCode = deviceLanguage ? deviceLanguage.substring(0, 2) : null;
    
    // Vérifier si la langue est prise en charge
    if (languageCode && (languageCode === 'fr' || languageCode === 'en')) {
      return languageCode;
    }
    return 'fr'; // Langue par défaut
  } catch (error) {
    console.error('Erreur lors de la détection de la langue du système:', error);
    return 'fr'; // Langue par défaut en cas d'erreur
  }
};

// Fonction pour récupérer la langue sauvegardée dans le stockage
const getUserLanguage = async (): Promise<string> => {
  try {
    const lang = await AsyncStorage.getItem('user-language');
    return lang || detectUserLanguage();
  } catch (error) {
    console.error('Erreur lors de la récupération de la langue de l\'utilisateur:', error);
    return detectUserLanguage();
  }
};

// Initialisation de i18n avec une langue par défaut
i18n
  .use(initReactI18next)
  .init({
    resources: resources,
    lng: 'fr', // On commence avec une langue par défaut, puis on la changera de manière asynchrone
    fallbackLng: 'fr',
    compatibilityJSON: 'v3' as const,
    interpolation: {
      escapeValue: false // React gère déjà l'échappement
    }
  });

// Fonction pour initialiser la langue de manière asynchrone
export const initializeLanguage = async (): Promise<string> => {
  try {
    const language = await getUserLanguage();
    await i18n.changeLanguage(language);
    return language;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la langue:', error);
    return 'fr';
  }
};

// Fonction pour changer la langue
export const changeLanguage = async (language: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem('user-language', language);
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Erreur lors du changement de langue:', error);
    return false;
  }
};

// Initialiser la langue de manière asynchrone
initializeLanguage();

export default i18n; 