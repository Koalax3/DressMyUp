import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClothing } from '../../contexts/ClothingContext';
import { ClothingItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { deleteClothing } from '../../services/clothingService';
import { subtypesByType, types } from '@/constants/Clothes';
import { fits } from '@/constants/Clothes';
import { PATTERNS } from '@/constants/Clothes';
import { MATERIALS } from '@/constants/Materials';
import MatchingClothesSection from '@/components/MatchingClothesSection';
import { ColorsTheme } from '@/constants/Colors';
import MultiColorDisplay from '@/components/MultiColorDisplay';
import Toast from 'react-native-toast-message';
import Header from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

export default function ClothingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { loadClothing, deleteClothing: deleteClothingFromContext } = useClothing();
  const [clothingItem, setClothingItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
  // Récupérer le vêtement au chargement avec la fonction loadClothing qui gère les vêtements de tous les utilisateurs
  const fetchClothing = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const clothing = await loadClothing(id.toString());
      setClothingItem(clothing);
    } catch (error) {
      console.error('Erreur lors de la récupération du vêtement:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du vêtement.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClothing();
  }, [id]);

  useEffect(() => {
    if (refreshing) {
      fetchClothing();
      setRefreshing(false);
    }
  }, [refreshing]);
  
  const handleDelete = () => {
    if (!clothingItem) return;
    
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce vêtement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: deleteClothingItem }
      ]
    );
  };

  const deleteClothingItem = async () => {
    if (!clothingItem || !user) return;

    try {
      setLoading(true);
      const success = await deleteClothing(clothingItem.id, user.id);
      
      if (success) {
        // Mettre à jour le contexte en supprimant le vêtement
        deleteClothingFromContext(clothingItem.id);
        Toast.show({
          type: 'delete',
          text1: 'Vêtement supprimé avec succès',
        });
        router.back();
      } else {
        Alert.alert('Erreur', 'Impossible de supprimer ce vêtement. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const shareClothing = async () => {
    if (!clothingItem) return;

    try {
      await Share.share({
        message: `Découvrez mon vêtement "${clothingItem.name}" sur DressMatch!`,
        url: clothingItem.image_url,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    return types[type] || type;
  };

  const getSubtypeLabel = (type: string, subtype?: string) => {
    if (!subtype) return '';
    const subtypes = subtypesByType[type as keyof typeof subtypesByType];
    return subtypes?.[subtype as keyof typeof subtypes] || subtype;
  };

  const getFitLabel = (fit?: string) => {
    if (!fit) return '';
    return fits[fit] || fit;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background.main }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </SafeAreaView>
    );
  }

  if (!clothingItem) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background.main }]}>
        <Text style={[styles.errorText, { color: colors.text.main }]}>Vêtement introuvable</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary.main }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <ScrollView>
        <Header title={" "} back >
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={shareClothing} style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color={isDarkMode ? colors.text.bright : colors.secondary.dark} />
            </TouchableOpacity>
            {user && user.id === clothingItem.user_id && <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={24} color={colors.primary.main} />
            </TouchableOpacity>}
          </View>
        </Header>

        <View style={styles.imageContainer}>
          <Image source={{ uri: clothingItem.image_url }} style={[styles.image, { backgroundColor: colors.background.deep }]} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text.main }]}>{clothingItem.name}</Text>
          {clothingItem.brand && (
            <Text style={[styles.brand, { color: colors.text.light }]}>{clothingItem.brand} {clothingItem.reference && `- ${clothingItem.reference}`}</Text>
          )}

          <View style={styles.detailsContainer}>
            <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>Type</Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>{getTypeLabel(clothingItem.type)}</Text>
            </View>
            
            {clothingItem.subtype && (
              <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>Sous-type</Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>{getSubtypeLabel(clothingItem.type, clothingItem.subtype)}</Text>
              </View>
            )}
            
            <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>Couleur</Text>
              <View style={styles.colorContainer}>
                <MultiColorDisplay colorString={clothingItem.color} />
              </View>
            </View>
            
            <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>Motif</Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>{PATTERNS[clothingItem.pattern as keyof typeof PATTERNS] || PATTERNS['plain']}</Text>
            </View>
            
            {clothingItem.material && (
              <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>Matériau</Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>{MATERIALS[clothingItem.material] || clothingItem.material}</Text>
              </View>
            )}

            {clothingItem.fit && (
              <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>Coupe</Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>{getFitLabel(clothingItem.fit)}</Text>
              </View>
            )}

          </View>

          {user && user.id === clothingItem.user_id && <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary.main }]}
              onPress={() => router.push({
                pathname: '/clothing/edit/[id]',
                params: { id: clothingItem.id }
              })}
            >
              <Ionicons name="create-outline" size={20} color={colors.text.bright} />
              <Text style={[styles.editButtonText, { color: colors.text.bright }]}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.outfitButton, { backgroundColor: colors.secondary.main }]}
              onPress={() => router.push({
                pathname: '/(tabs)/create',
                params: { selectItem: clothingItem.id }
              })}
            >
              <Ionicons name="shirt-outline" size={20} color={colors.text.bright} />
              <Text style={[styles.outfitButtonText, { color: colors.text.bright }]}>Créer une tenue</Text>
            </TouchableOpacity>
          </View>}

          <MatchingClothesSection currentItem={clothingItem} />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    position: 'relative',
    padding: 5,
    marginLeft: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: '90%',
    height: 500,
    objectFit: 'contain',
    borderRadius: 15,
  },
  infoContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  brand: {
    fontSize: 16,
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 30,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  outfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginLeft: 10,
  },
  outfitButtonText: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    marginRight: 10,
  },
  metadataText: {
    fontSize: 16,
    fontWeight: '500',
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 20,
  },
  matchButtonText: {
    fontWeight: '500',
  },
  matchButtonIcon: {
    marginRight: 10,
  },
}); 