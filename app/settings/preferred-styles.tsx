import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  Alert, 
  ActivityIndicator, 
  FlatList,
  ListRenderItemInfo
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ColorsTheme } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { STYLES } from '@/constants/Outfits';
import { useAuth } from '@/contexts/AuthContext';
import { PreferencesService } from '@/services';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import Toast from 'react-native-toast-message';
import Header from '@/components/Header';
import { useTranslation } from '@/i18n/useTranslation';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2; // 30 pour les paddings, 15 pour l'espacement entre les colonnes
const COLUMN_COUNT = 2;

// Type pour les styles dans la liste
type StyleItem = {
  id: string;
  image: any;
};

export default function PreferredStylesScreen() {
  const { user } = useAuth();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
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
      Toast.show({
        text1: t('success.saved'),
        type: 'success',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
      Alert.alert(t('errors.generic'), t('errors.tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  const keyExtractor = (item: StyleItem) => item.id;

  const renderItem = ({ item }: ListRenderItemInfo<StyleItem>) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.background.deep },
          selectedStyles.includes(item.id) && styles.selectedCard
        ]}
        onPress={() => toggleStyle(item.id)}
      >
        <View style={{position: 'relative'}}>
          <Image source={item.image} style={styles.cardImage} />
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
            <Text style={styles.cardTitle}>{t(`styles.${item.id}`)}</Text>
          </View>
          {selectedStyles.includes(item.id) && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color={ColorsTheme.primary.main} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title={t('settings.preferredStyles')} back/>

      <FlatList
        data={STYLES}
        initialNumToRender={8}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={COLUMN_COUNT}
        key={"two-column-list"}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.columnWrapper}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <TouchableOpacity 
        style={[
          styles.saveButton, 
          isLoading && styles.saveButtonDisabled,
          { backgroundColor: colors.primary.main }
        ]} 
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ?
        <ActivityIndicator size="large" color={colors.white} />
        : 
        <Text style={styles.saveButtonText}>
          {t('common.save')}
        </Text>
        }
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
  contentContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
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
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 