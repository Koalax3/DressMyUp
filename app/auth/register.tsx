import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ColorsTheme } from '@/constants/Colors';
import TextInput from '@/components/TextInput';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !username) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, username);
      
      if (error) {
        console.error('Erreur d\'inscription détaillée:', error);
        
        // Gérer les différents types d'erreurs
        if (error.message && error.message.includes('email')) {
          Alert.alert('Erreur d\'inscription', 'Adresse email invalide ou déjà utilisée');
        } else if (error.message && error.message.includes('password')) {
          Alert.alert('Erreur d\'inscription', 'Le mot de passe est trop faible');
        } else {
          Alert.alert('Erreur d\'inscription', error.message || 'Une erreur s\'est produite lors de l\'inscription');
        }
      } else {
        // Rediriger directement vers les onglets au lieu de la page de connexion
        Alert.alert(
          'Inscription réussie', 
          'Votre compte a été créé avec succès.',
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
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
        <Text style={styles.title}>DressMeUp</Text>
        <Text style={styles.subtitle}>Créez votre compte</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          placeholder="Confirmer le mot de passe"
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
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.link}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorsTheme.white,
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
    color: ColorsTheme.white,
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