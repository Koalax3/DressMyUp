import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTranslation } from '../../i18n/useTranslation';
import { changeLanguage } from '../../i18n/i18n';
import { Ionicons } from '@expo/vector-icons';
import CountryFlag from 'react-native-country-flag';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorsTheme, DarkColorsTheme } from '@/constants/Colors';
import Toast from 'react-native-toast-message';

type Language = {
  code: string;
  name: string;
  countryCode: string;
};

const LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', countryCode: 'fr' },
  { code: 'en', name: 'English', countryCode: 'gb' },
  { code: 'de', name: 'Deutsch', countryCode: 'de' },
  { code: 'es', name: 'España', countryCode: 'es' },
  { code: 'pt', name: 'Português', countryCode: 'pt' },
  { code: 'it', name: 'Italiano', countryCode: 'it' },
  { code: 'ar', name: 'العربية', countryCode: 'ps' }
];

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? DarkColorsTheme : ColorsTheme;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'fr');

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setSelectedLanguage(languageCode);
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: t('success.changeLanguage'),
      });
    } catch (error) {
      console.error('Erreur lors du changement de langue:', error);
      Toast.show({
        type: 'error',
        text1: t('errors.generic'),
        text2: t('errors.tryAgain')
      });
    }
  };

  const selectedLanguageItem = LANGUAGES.find(lang => lang.code === selectedLanguage) || LANGUAGES[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.settingItemLeft,
          { backgroundColor: isDarkMode ? colors.background.deep : '#fff' }
        ]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.flagContainer}>
          <CountryFlag isoCode={selectedLanguageItem.countryCode} size={20} />
        </View>
        <Text style={[styles.label, { color: isDarkMode ? colors.text.main : '#333' }]}>
          {t('settings.language')}
        </Text>
        <View style={styles.rightContent}>
          <Text style={[styles.selectedValue, { color: isDarkMode ? colors.text.light : '#666' }]}>
            {selectedLanguageItem.name}
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={isDarkMode ? colors.text.light : "#ACACAC"} 
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? colors.background.deep : '#fff' }
          ]}>
            <Text style={[
              styles.modalTitle,
              { color: isDarkMode ? colors.text.main : '#333' }
            ]}>
              {t('settings.language')}
            </Text>
            
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  { backgroundColor: isDarkMode ? colors.background.dark : '#f8f8f8' },
                  selectedLanguage === language.code && {
                    backgroundColor: isDarkMode ? colors.primary.dark : '#e6e6ff'
                  }
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageContent}>
                  <CountryFlag isoCode={language.countryCode} size={24} />
                  <Text 
                    style={[
                      styles.languageText,
                      { color: isDarkMode ? colors.text.main : '#333' },
                      selectedLanguage === language.code && {
                        color: isDarkMode ? colors.primary.light : '#0066cc',
                        fontWeight: 'bold'
                      }
                    ]}
                  >
                    {language.name}
                  </Text>
                </View>
                {selectedLanguage === language.code && (
                  <Ionicons 
                    name="checkmark" 
                    size={24} 
                    color={isDarkMode ? colors.primary.light : colors.primary.main} 
                  />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: isDarkMode ? colors.background.dark : '#f2f2f2' }
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[
                styles.cancelButtonText,
                { color: isDarkMode ? colors.text.main : '#333' }
              ]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    height: 65,
  },
  flagContainer: {
    marginRight: 15,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedValue: {
    fontSize: 16,
    marginRight: 5,
  },
  chevron: {
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 16,
    marginLeft: 15,
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LanguageSelector; 