import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, TextInput, Image, Modal, FlatList, ScrollView } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useScroll } from '../../contexts/ScrollContext';
import { useFilter } from '../../contexts/FilterContext';
import { ClothingItem, Outfit } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingButton from '../../components/FloatingButton';
import Header from '@/components/Header';
import Button from '@/components/Button';
import ClotheItem from '@/components/ClotheItem';
import OutfitPreview from '@/components/OutfitPreview';
import ClotheFilterModal, { ClotheFilters } from '../../components/ClotheFilterModal';
import OutfitFilterModal, { OutfitFilters } from '../../components/OutfitFilterModal';
import { COLORS, BRANDS, types, subtypesByType, PATTERNS } from '../../constants/Clothes';
import { ColorsTheme } from '@/constants/Colors';
import { OutfitService } from '@/services';

export default function WardrobeScreen() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const { 
    // États et setters pour les filtres
    clothesFilter,
    setClothesFilter,
    clothesAdvancedFilters: advancedFilters,
    setClothesAdvancedFilters: setAdvancedFilters,
    outfitFilters,
    setOutfitFilters,
    
    // États et setters pour les modales
    showClothesFilterModal: showFilterModal,
    setShowClothesFilterModal: setShowFilterModal,
    showOutfitFilterModal,
    setShowOutfitFilterModal,
    
    // Fonctions utilitaires
    getClothesFilterCount,
    getOutfitFilterCount,
    
    // Recherche
    searchText,
    setSearchText
  } = useFilter();
  
  // États locaux restants
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const clothesListRef = useRef<Animated.FlatList<ClothingItem>>(null);
  const outfitsListRef = useRef<Animated.FlatList<Outfit>>(null);
  const [viewMode, setViewMode] = useState<'clothes' | 'outfits'>('clothes');
  
  const fetchClothes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (clothesFilter && viewMode === 'clothes') {
        query = query.eq('type', clothesFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des vêtements:', error);
      } else {
        setClothes(data || []);
        applyFilters(data || [], searchText, clothesFilter, advancedFilters);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchOutfits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: userOutfits, error: userOutfitsError } = await OutfitService.fetchOutfitsForWardrobe(user.id)
      if (userOutfitsError) {
        console.error('Erreur lors de la récupération des tenues:', userOutfitsError);
      }
      if(userOutfits) {
        setOutfits(userOutfits);
        applyOutfitFilters(userOutfits, searchText);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (
    items: ClothingItem[], 
    search: string, 
    typeFilter: string | null, 
    filters: ClotheFilters
  ) => {
    let filtered = [...items];
    
    // Filtre par type
    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filtre par texte de recherche
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.brand && item.brand.toLowerCase().includes(searchLower)) ||
        item.color.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par marques
    if (filters.brands.length > 0) {
      filtered = filtered.filter(item => 
        item.brand && filters.brands.includes(item.brand)
      );
    }

    // Filtre par couleurs
    if (filters.colors.length > 0) {
      filtered = filtered.filter(item => {
        // Trouver l'ID de couleur correspondant au nom sélectionné dans COLORS
        const selectedColorIds = filters.colors.map(colorName => {
          const colorObj = COLORS.find(c => c.name === colorName);
          return colorObj ? colorObj.id : null;
        }).filter(id => id !== null);
        
        // Vérifier si l'item a une des couleurs sélectionnées
        return selectedColorIds.some(colorId => 
          item.color.toLowerCase() === colorId?.toLowerCase()
        );
      });
    }

    // Filtre par motifs
    if (filters.patterns && filters.patterns.length > 0) {
      filtered = filtered.filter(item => 
        item.pattern && filters.patterns.includes(item.pattern)
      );
    }

    // Filtre par matériaux
    if (filters.materials && filters.materials.length > 0) {
      filtered = filtered.filter(item => 
        item.material && filters.materials.includes(item.material)
      );
    }

    // Mettre à jour l'état
    setFilteredClothes(filtered);
  };
  
  const applyOutfitFilters = (
    items: Outfit[],
    search: string
  ) => {
    let filtered = [...items];
    
    // Filtre par texte de recherche
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtre par saisons
    if (outfitFilters.seasons.length > 0) {
      filtered = filtered.filter(item => 
        item.season && outfitFilters.seasons.includes(item.season)
      );
    }
    
    // Filtre par occasions
    if (outfitFilters.occasions.length > 0) {
      filtered = filtered.filter(item => 
        item.occasion && outfitFilters.occasions.includes(item.occasion)
      );
    }
    
    // Filtre par genres
    if (outfitFilters.genders.length > 0) {
      filtered = filtered.filter(item => 
        item.gender && outfitFilters.genders.includes(item.gender)
      );
    }
    
    // Filtre par favoris
    if (!outfitFilters.onlyFavorites) {
      filtered = filtered.filter(item => 
        item.user_id === user?.id // Si l'utilisateur n'est pas le créateur, c'est un outfit liké
      );
    }
    
    setFilteredOutfits(filtered);
  };

  useEffect(() => {
    if (viewMode === 'clothes') {
      fetchClothes();
    } else {
      fetchOutfits();
    }
  }, [user, clothesFilter, viewMode, searchText, advancedFilters, outfitFilters]);

  const onRefresh = () => {
    setRefreshing(true);
    if (viewMode === 'clothes') {
      fetchClothes();
    } else {
      fetchOutfits();
    }
  };

  const addItem = () => {
    if (viewMode === 'clothes') {
      router.push('/clothing/add');
    } else {
      router.push('/(tabs)/create');
    }
  };

  const openFilterModal = () => {
    setShowFilterModal(true);
  };
  
  const openOutfitFilterModal = () => {
    setShowOutfitFilterModal(true);
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'clothes' ? 'outfits' : 'clothes');
    setClothesFilter(null); // Réinitialiser le filtre lors du changement de mode
  };

  const FilterButton = ({ title, value }: { title: string; value: string | null }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        clothesFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => setClothesFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          clothesFilter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Ma Garde-robe">
        <Button 
          onPress={toggleViewMode} 
          icon={viewMode === 'clothes' ? "body" : "shirt-outline"}
        />
      </Header>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {viewMode === 'clothes' ? (
            <TouchableOpacity 
              style={styles.filterIconButton}
              onPress={openFilterModal}
            >
              <Ionicons name="options-outline" size={24} color={ColorsTheme.primary.main} />
              {getClothesFilterCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getClothesFilterCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.filterIconButton}
              onPress={openOutfitFilterModal}
            >
              <Ionicons name="options-outline" size={24} color={ColorsTheme.primary.main} />
              {getOutfitFilterCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getOutfitFilterCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {viewMode === 'clothes' && (
        <View style={{}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <FilterButton title="Tous" value={null} />
          <FilterButton title="Hauts" value="top" />
          <FilterButton title="Bas" value="bottom" />
          <FilterButton title="Chaussures" value="shoes" />
          <FilterButton title="Accessoires" value="accessory" />
          <FilterButton title="Ensembles" value="ensemble" />
          <View style={{ width: 15 }} />
        </ScrollView>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97A5C" />
        </View>
      ) : viewMode === 'clothes' ? (
        filteredClothes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText || getClothesFilterCount() > 0 
                ? 'Aucun vêtement ne correspond à votre recherche' 
                : 'Votre garde-robe est vide'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText || getClothesFilterCount() > 0
                ? 'Essayez avec d\'autres termes ou filtres'
                : 'Commencez à ajouter vos vêtements en appuyant sur le bouton +'}
            </Text>
            {!searchText && getClothesFilterCount() === 0 && (
              <TouchableOpacity 
                style={styles.addEmptyButton}
                onPress={addItem}
              >
                <Text style={styles.addEmptyButtonText}>Ajouter un vêtement</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.FlatList
            ref={clothesListRef}
            key="clothes-list"
            data={filteredClothes}
            renderItem={({ item }) => <ClotheItem item={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97A5C']} />
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        )
      ) : (
        filteredOutfits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText
                ? 'Aucune tenue ne correspond à votre recherche' 
                : 'Vous n\'avez pas encore de tenues'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchText
                ? 'Essayez avec d\'autres termes'
                : 'Créez votre première tenue en appuyant sur le bouton +'}
            </Text>
            {!searchText && (
              <TouchableOpacity 
                style={styles.addEmptyButton}
                onPress={addItem}
              >
                <Text style={styles.addEmptyButtonText}>Créer une tenue</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Animated.FlatList
            ref={outfitsListRef}
            key="outfits-list"
            data={filteredOutfits}
            renderItem={({ item }) => <OutfitPreview outfit={item} userWardrobe={clothes} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.outfitGrid}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.outfitRow}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97A5C']} />
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        )
      )}

      <ClotheFilterModal 
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={setAdvancedFilters}
        clothes={clothes}
        currentFilters={advancedFilters}
      />
      
      <OutfitFilterModal 
        visible={showOutfitFilterModal}
        onClose={() => setShowOutfitFilterModal(false)}
        onApplyFilters={setOutfitFilters}
        currentFilters={outfitFilters}
      />

      <FloatingButton 
        iconName="add" 
        label={viewMode === 'clothes' ? "Ajouter" : "Créer"} 
        onPress={addItem} 
        backgroundColor="#F97A5C"
        iconColor="#FFFFFF"
        scrollRef={viewMode === 'clothes' ? clothesListRef : outfitsListRef}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorsTheme.white,
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ColorsTheme.text.main,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewModeText: {
    fontSize: 14,
    color: ColorsTheme.text.main,
    marginLeft: 5,
  },
  searchContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ColorsTheme.gray,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
    color: ColorsTheme.primary.main,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ColorsTheme.text.main,
  },
  filterIconButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: ColorsTheme.white,
    borderWidth: 1,
    borderColor: ColorsTheme.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: ColorsTheme.primary.main,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: ColorsTheme.background.main,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#F97A5C',
  },
  filterButtonText: {
    fontSize: 14,
    color: ColorsTheme.text.main,
  },
  filterButtonTextActive: {
    color: ColorsTheme.background.main,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ColorsTheme.text.main,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: ColorsTheme.text.main,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addEmptyButton: {
    backgroundColor: ColorsTheme.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addEmptyButtonText: {
    color: ColorsTheme.background.main,
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 15,
  },
  outfitGrid: {
    paddingHorizontal: 15,
  },
  outfitRow: {
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ColorsTheme.text.main,
  },
  modalItem: {
    padding: 10,
    borderWidth: 2,
    borderColor: ColorsTheme.background.deep,
    borderRadius: 5,
  },
  modalItemSelected: {
    borderColor: ColorsTheme.primary.main,
  },
  modalItemText: {
    fontSize: 16,
    color: ColorsTheme.text.main,
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: ColorsTheme.background.deep,
  },
  modalButtonPrimary: {
    backgroundColor: ColorsTheme.primary.main,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ColorsTheme.background.main,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ColorsTheme.background.main,
  },
}); 