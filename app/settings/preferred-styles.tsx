import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ColorsTheme } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '@/components/Header';
import { STYLES } from '@/constants/Outfits';
import { useAuth } from '@/contexts/AuthContext';
import { PreferencesService } from '@/services';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 30 - 10) / 2; // 30 pour les paddings, 10 pour l'espace entre les colonnes

export default function PreferredStylesScreen() {
  const { user } = useAuth();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!user) return;
    try {
      const preferences = await PreferencesService.getPreferences(user.id);
      if (preferences?.styles) {
        setSelectedStyles(preferences.styles);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    }
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await PreferencesService.updatePreferences(user.id, selectedStyles);
      Alert.alert(
        'Succès',
        'Vos styles préférés ont été enregistrés',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la sauvegarde de vos préférences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={[styles.header, { borderBottomColor: colors.text.lighter }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.main} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.main }]}>Styles préférés</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.card,
                { backgroundColor: colors.background.deep },
                selectedStyles.includes(style.id) && styles.selectedCard
              ]}
              onPress={() => toggleStyle(style.id)}
            >
              <View style={{position: 'relative'}}>
                <Image source={style.image} style={styles.cardImage} />
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)']}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    height: '100%',
                    width: '100%'
                  }}
                  start={{x: 0.5, y: 0.5}}
                  end={{x: 0.5, y: 1}}
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.cardTitle}>{style.name}</Text>
                </View>
                {selectedStyles.includes(style.id) && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={ColorsTheme.primary.main} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[
          styles.saveButton, 
          isLoading && styles.saveButtonDisabled,
          { backgroundColor: isLoading ? colors.gray : colors.primary.main }
        ]} 
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10,
  },
  card: {
    width: cardWidth,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: ColorsTheme.primary.main,
  },
  cardImage: {
    width: '100%',
    height: cardWidth * 1.5,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saveButton: {
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 