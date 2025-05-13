import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import TextInput from '@/components/TextInput';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const i18n = useLanguage();
  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert(t('errors.generic'), t('errors.requiredField'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('errors.generic'), t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('errors.generic'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, username, {language: i18n.language});
      
      if (error) {
        console.error('Erreur d\'inscription détaillée:', error);
        
        // Gérer les différents types d'erreurs
        if (error.message && error.message.includes('email')) {
          Alert.alert(t('auth.registerError'), t('auth.emailInvalid'));
        } else if (error.message && error.message.includes('password')) {
          Alert.alert(t('auth.registerError'), t('auth.passwordWeak'));
        } else {
          Alert.alert(t('auth.registerError'), error.message || t('errors.generic'));
        }
      } else {
        // Rediriger directement vers les onglets au lieu de la page de connexion
        Alert.alert(
          t('auth.registerSuccess'), 
          t('auth.confirmationEmail'),
          [{ text: t('common.ok'), onPress: () => router.replace('/auth/login') }]
        );
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      Alert.alert(t('errors.generic'), t('errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background.main }]} 
      contentContainerStyle={styles.contentContainer}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text.main }]}>DressMatch</Text>
        <Text style={[styles.subtitle, { color: colors.text.bright }]}>{t('auth.createAccount')}</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: colors.gray, color: colors.text.main }]}
          placeholderTextColor={colors.text.light}
        />
        
        <TextInput
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { backgroundColor: colors.gray, color: colors.text.main }]}
          placeholderTextColor={colors.text.light}
        />
        
        <TextInput
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.gray, color: colors.text.main }]}
          placeholderTextColor={colors.text.light}
        />
        
        <TextInput
          placeholder={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.gray, color: colors.text.main }]}
          placeholderTextColor={colors.text.light}
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary.main }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.white }]}>{t('auth.register')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.bright }]}>{t('auth.alreadyHaveAccount')}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={[styles.link, { color: colors.primary.main }]}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    borderRadius: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    marginRight: 5,
  },
  link: {
    fontWeight: 'bold',
  },
}); 