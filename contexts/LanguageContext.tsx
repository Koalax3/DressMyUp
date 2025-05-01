import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import i18n, { changeLanguage, initializeLanguage } from '../i18n/i18n';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: async () => {},
  isLoading: true,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState('fr');
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour détecter la langue de l'appareil sans RNLocalize
  const detectDeviceLanguage = (): string => {
    try {
      // Méthode alternative pour obtenir la langue du système
      let deviceLanguage: string | undefined;
      
      if (Platform.OS === 'ios') {
        // @ts-ignore
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
      return (languageCode && ['fr', 'en'].includes(languageCode)) ? languageCode : 'fr';
    } catch (error) {
      console.error('Erreur lors de la détection de la langue du système:', error);
      return 'fr'; // Langue par défaut en cas d'erreur
    }
  };

  // Fonction pour initialiser la langue
  const initLanguage = async () => {
    try {
      setIsLoading(true);
      // Utiliser la fonction d'initialisation de i18n
      const languageToUse = await initializeLanguage();
      
      // Mettre à jour l'état local
      setLanguageState(languageToUse);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la langue:', error);
      // En cas d'erreur, utiliser la langue par défaut
      setLanguageState('fr');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour changer la langue
  const setLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem('user-language', lang);
      await changeLanguage(lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Erreur lors du changement de langue:', error);
    }
  };

  // Initialiser la langue au montage du composant
  useEffect(() => {
    initLanguage();
  }, []);

  const value = {
    language,
    setLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 