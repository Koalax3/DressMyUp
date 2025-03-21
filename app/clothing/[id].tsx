import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClothingItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getClothingById, deleteClothing } from '../../services/clothingService';
import { subtypesByType, types } from '@/constants/Clothes';
import { fits } from '@/constants/Clothes';

export default function ClothingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [clothingItem, setClothingItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClothingItem();
  }, [id]);

  const fetchClothingItem = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const data = await getClothingById(id.toString(), user.id);
      if (data) {
        setClothingItem(data);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du vêtement.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
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
        Alert.alert('Succès', 'Vêtement supprimé avec succès.');
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
        message: `Découvrez mon vêtement "${clothingItem.name}" sur DressMeUp!`,
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </SafeAreaView>
    );
  }

  if (!clothingItem) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Vêtement introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={shareClothing} style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image source={{ uri: clothingItem.image_url }} style={styles.image} />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>{clothingItem.name}</Text>
          {clothingItem.brand && (
            <Text style={styles.brand}>{clothingItem.brand}</Text>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{getTypeLabel(clothingItem.type)}</Text>
            </View>
            
            {clothingItem.subtype && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sous-type</Text>
                <Text style={styles.detailValue}>{getSubtypeLabel(clothingItem.type, clothingItem.subtype)}</Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Couleur</Text>
              <View style={styles.colorContainer}>
                <View style={[styles.colorCircle, { backgroundColor: clothingItem.color }]} />
                <Text style={styles.detailValue}>{clothingItem.color}</Text>
              </View>
            </View>

            {clothingItem.fit && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Coupe</Text>
                <Text style={styles.detailValue}>{getFitLabel(clothingItem.fit)}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push({
                pathname: '/clothing/edit/[id]',
                params: { id: clothingItem.id }
              })}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.outfitButton}
              onPress={() => router.push({
                pathname: '/(tabs)/create',
                params: { selectItem: clothingItem.id }
              })}
            >
              <Ionicons name="shirt-outline" size={20} color="#fff" />
              <Text style={styles.outfitButtonText}>Créer une tenue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
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
    padding: 5,
    marginLeft: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: '90%',
    height: 350,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  brand: {
    fontSize: 16,
    color: '#666',
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
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
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
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  outfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b90ff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginLeft: 10,
  },
  outfitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 