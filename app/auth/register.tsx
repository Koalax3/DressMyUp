import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorsTheme } from '@/constants/Colors';
import TextInput from '@/components/TextInput';
import { useTranslation } from '@/i18n/useTranslation';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();

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
      const { error } = await signUp(email, password, username);
      
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="dark" />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>DressMatch</Text>
        <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          placeholder={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.register')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.link}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorsTheme.background.main,
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
    color: ColorsTheme.text.main,
  },
  subtitle: {
    fontSize: 16,
    color: ColorsTheme.text.bright,
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: ColorsTheme.primary.main,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: ColorsTheme.background.main,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: ColorsTheme.text.bright,
    marginRight: 5,
  },
  link: {
    color: ColorsTheme.primary.main,
    fontWeight: 'bold',
  },
}); 