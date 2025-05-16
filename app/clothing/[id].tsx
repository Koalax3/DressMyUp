import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Share, Modal, StatusBar } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useClothing } from '../../contexts/ClothingContext';
import { ClothingItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { deleteClothing } from '../../services/clothingService';
import MatchingClothesSection from '@/components/MatchingClothesSection';
import { ColorsTheme } from '@/constants/Colors';
import MultiColorDisplay from '@/components/MultiColorDisplay';
import Toast from 'react-native-toast-message';
import Header from '@/components/Header';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';
import { useOutfit } from '@/contexts/OutfitContext';
import ButtonLink from '@/components/ui/ButtonLink';
import VintedLogo from '@/assets/images/vinted.svg';
import ImageViewer from 'react-native-image-zoom-viewer';

export default function ClothingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { loadClothing, deleteClothing: deleteClothingFromContext } = useClothing();
  const { setClothesExploreOutfit } = useOutfit();
  const [clothingItem, setClothingItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  const [fullscreenImage, setFullscreenImage] = useState(false);
  
  // Récupérer le vêtement au chargement avec la fonction loadClothing qui gère les vêtements de tous les utilisateurs
  const fetchClothing = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const clothing = await loadClothing(id.toString());
      setClothingItem(clothing);
    } catch (error) {
      console.error('Erreur lors de la récupération du vêtement:', error);
      Alert.alert(t('errors.generic'), t('clothing.loadingError'));
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
      t('common.confirm'),
      t('clothing.deleteConfirmation'),
      [
        { text: t('clothing.cancel'), style: 'cancel' },
        { text: t('clothing.delete'), style: 'destructive', onPress: deleteClothingItem }
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
          text1: t('clothing.deleteSuccess'),
        });
        setRefreshing(true);
        router.back();
      } else {
        Alert.alert(t('errors.generic'), t('clothing.deleteError'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('errors.generic'), t('clothing.generalError'));
    } finally {
      setLoading(false);
    }
  };

  const shareClothing = async () => {
    if (!clothingItem) return;

    try {
      await Share.share({
        message: t('clothing.shareMessage', { name: clothingItem.name || '' }),
        url: clothingItem.image_url,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    return t(`clothingTypes.${type}`) || type;
  };

  const getSubtypeLabel = (type: string, subtype?: string) => {
    if (!subtype) return '';
    return t(`clothingSubtypes.${type}.${subtype}`) || subtype;
  };

  const getFitLabel = (fit?: string) => {
    if (!fit) return '';
    return t(`clothingFits.${fit}`) || fit;
  };

  const getPatternLabel = (pattern: string | null): string => {
    if (!pattern) return '';
    return t(`clothingPatterns.${pattern}`) || pattern;
  };

  const getMaterialLabel = (material: string) => {
    return t(`clothingMaterials.${material}`) || material;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background.main }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={{ marginTop: 10, color: colors.text.main }}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!clothingItem) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background.main }]}>
        <Text style={[styles.errorText, { color: colors.text.main }]}>{t('clothing.notFound')}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary.main }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>{t('clothing.back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const exploreClothing = () => {
    setClothesExploreOutfit([clothingItem]);
    router.push('/(tabs)/explore');
  };

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
          <TouchableOpacity onPress={() => setFullscreenImage(true)}>
            <Image source={{ uri: clothingItem.image_url }} style={[styles.image, { backgroundColor: colors.gray }]} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text.main }]}>{clothingItem.name}</Text>
          {clothingItem.brand && (
            <Text style={[styles.brand, { color: colors.text.light }]}>{clothingItem.brand} {clothingItem.reference && `- ${clothingItem.reference}`}</Text>
          )}

          <View style={styles.detailsContainer}>
            <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>{t('clothing.typeLabel')}</Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>{getTypeLabel(clothingItem.type)}</Text>
            </View>
            
            {clothingItem.subtype && (
              <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>{t('clothing.subtypeLabel')}</Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>{getSubtypeLabel(clothingItem.type, clothingItem.subtype)}</Text>
              </View>
            )}
            
            <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>{t('clothing.colorLabel')}</Text>
              <View style={styles.colorContainer}>
                <MultiColorDisplay colorString={clothingItem.color} />
              </View>
            </View>
            
            <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
              <Text style={[styles.detailLabel, { color: colors.text.light }]}>{t('clothing.patternLabel')}</Text>
              <Text style={[styles.detailValue, { color: colors.text.main }]}>{getPatternLabel(clothingItem.pattern)}</Text>
            </View>
            
            {clothingItem.material && (
              <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>{t('clothing.materialLabel')}</Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>{getMaterialLabel(clothingItem.material)}</Text>
              </View>
            )}

            {clothingItem.fit && (
              <View style={[styles.detailItem, { borderBottomColor: colors.text.lighter }]}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>{t('clothing.fitLabel')}</Text>
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
              <Ionicons name="create-outline" size={20} color={colors.white} />
              <Text style={[styles.editButtonText]}>{t('clothing.modifyButton')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.outfitButton, { backgroundColor: colors.secondary.main }]}
              onPress={exploreClothing}
            >
              <Ionicons name="search-outline" size={20} color={colors.white} />
              <Text style={[styles.outfitButtonText]}>{t('clothing.findOutfitButton')}</Text>
            </TouchableOpacity>
          </View>}
          {user && user.id !== clothingItem.user_id && <MatchingClothesSection currentItem={clothingItem} />}

          {(clothingItem.external_link || clothingItem.vinted_link) && <View style={styles.linksContainer}>
            <Text style={[styles.linkLabel, { color: colors.text.main }]}>{t('clothing.linksLabel')}</Text>
          {clothingItem.external_link && <ButtonLink url={clothingItem.external_link} style={{ backgroundColor: isDarkMode ? colors.white : colors.black }} textColor={isDarkMode ? colors.black : colors.white} iconColor={isDarkMode ? colors.black : colors.white} title={t('clothing.externalLink')} icon="cart" warning />}
          {clothingItem.vinted_link && <ButtonLink url={clothingItem.vinted_link} style={{ backgroundColor: colors.vinted }} title={t('clothing.vintedLink')} otherIcon={<VintedLogo width={18} height={18} fill={colors.white} style={{ marginRight: 8 }} />} />}
          </View>}
        </View>
      </ScrollView>

      <Modal
        visible={fullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenImage(false)}
      >
        <StatusBar hidden={fullscreenImage} />
        <ImageViewer
          imageUrls={[{ url: clothingItem.image_url }]}
          enableSwipeDown={true}
          onCancel={() => setFullscreenImage(false)}
          saveToLocalByLongPress={false}
          backgroundColor="rgba(0, 0, 0, 0.9)"
          renderHeader={() => (
            <TouchableOpacity 
              style={styles.fullscreenCloseButton} 
              onPress={() => setFullscreenImage(false)}
            >
              <Ionicons name="close" size={30} color={colors.white} />
            </TouchableOpacity>
          )}
          renderIndicator={() => <View/>}
        />
      </Modal>
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
    height: 300,
    aspectRatio: 3/4,
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
    color: ColorsTheme.white,
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
    color: ColorsTheme.white,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: ColorsTheme.white,
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
  linksContainer: {
    flexDirection: 'column',
    marginTop: 20,
    gap: 10,
  },
  linkLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  externalLink: {
    marginVertical: 8,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '90%',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
}); 