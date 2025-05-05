import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import TextInput from '@/components/TextInput';
import { useTranslation } from '@/i18n/useTranslation';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('errors.generic'), t('errors.requiredField'));
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert(t('errors.authFailed'), error.message);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text.main }]}>DressMatch</Text>
        <Text style={[styles.subtitle, { color: colors.text.bright }]}>{t('auth.virtualWardrobe')}</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.text.light}
          style={[styles.input, { backgroundColor: colors.gray, color: colors.text.main }]}
        />
        
        <TextInput
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.text.light}
          style={[styles.input, { backgroundColor: colors.gray, color: colors.text.main }]}
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary.main }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.white }]}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.bright }]}>{t('auth.noAccount')}</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={[styles.link, { color: colors.primary.main }]}>{t('auth.register')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
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