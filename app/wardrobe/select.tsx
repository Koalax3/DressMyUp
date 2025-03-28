import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, TextInput, Image } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClothingItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClotheFilterModal, { ClotheFilters as Filters } from '../../components/ClotheFilterModal';
import { COLORS, BRANDS, types, subtypesByType, PATTERNS } from '../../constants/Clothes';
import ClotheView from '@/components/ClotheView';

export default function WardrobeSelectScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Filters>({ brands: [], colors: [], patterns: [], materials: [] });
  const [selectedClothes, setSelectedClothes] = useState<string[]>([]);
  const enableMatching = params.enableMatching === 'true';
  
  // Récupérer les vêtements déjà sélectionnés depuis les paramètres
  useEffect(() => {
    if (params.selectedIds) {
      const ids = (params.selectedIds as string).split(',').filter(id => id !== '');
      setSelectedClothes(ids);
    }
  }, [params.selectedIds]);

  const fetchClothes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter) {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des vêtements:', error);
      } else {
        setClothes(data || []);
        applyFilters(data || [], searchText, filter, advancedFilters);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fonction pour appliquer tous les filtres
  const applyFilters = (
    items: ClothingItem[], 
    search: string, 
    typeFilter: string | null, 
    filters: Filters
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
          const colorObj = COLORS.find((c: typeof COLORS[0]) => c.name === colorName);
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

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (clothes.length > 0) {
      applyFilters(clothes, searchText, filter, advancedFilters);
    }
  }, [searchText, filter, advancedFilters]);

  useFocusEffect(
    React.useCallback(() => {
      fetchClothes();
    }, [user, filter, advancedFilters, searchText])
  );

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    applyFilters(clothes, text, filter, advancedFilters);
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setAdvancedFilters(newFilters);
    applyFilters(clothes, searchText, filter, newFilters);
  };

  useEffect(() => {
    fetchClothes();
  }, [user, filter, advancedFilters, searchText]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClothes();
  };

  const openFilterModal = () => {
    setShowFilterModal(true);
  };

  // Gérer la sélection d'un vêtement
  const toggleSelection = (id: string) => {
    setSelectedClothes(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  // Confirmer la sélection et retourner à la page de création de tenue
  const confirmSelection = () => {
    // Récupérer tous les paramètres du formulaire
    const formName = params.formName || '';
    const formDescription = params.formDescription || '';
    const formSeason = params.formSeason || 'all';
    const formOccasion = params.formOccasion || 'casual';
    const formImage = params.formImage || '';

    router.push({
      pathname: '/(tabs)/create' as any,
      params: { 
        selectedClothes: selectedClothes.join(','),
        returnFromSelect: 'true',
        formName,
        formDescription,
        formSeason,
        formOccasion,
        formImage
      }
    });
  };

  // Badge count pour savoir combien de filtres sont appliqués
  const getFilterCount = () => {
    return advancedFilters.brands.length + advancedFilters.colors.length + advancedFilters.patterns.length + advancedFilters.materials.length;
  };

  const FilterButton = ({ title, value }: { title: string; value: string | null }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => {
        setFilter(value);
        applyFilters(clothes, searchText, value, advancedFilters);
      }}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleFilterModalClose = (newFilters?: Filters) => {
    if (newFilters) {
      setAdvancedFilters(newFilters);
      applyFilters(clothes, searchText, filter, newFilters);
    }
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setFilter(null);
    setSearchText('');
    setAdvancedFilters({ brands: [], colors: [], patterns: [], materials: [] });
    setFilteredClothes(clothes);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Sélectionner des vêtements</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              value={searchText}
              onChangeText={handleSearchTextChange}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.filterIconButton}
            onPress={openFilterModal}
          >
            <Ionicons name="options-outline" size={24} color="#333" />
            {getFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton title="Tous" value={null} />
        <FilterButton title="Hauts" value="top" />
        <FilterButton title="Bas" value="bottom" />
        <FilterButton title="Chaussures" value="shoes" />
        <FilterButton title="Accessoires" value="accessory" />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97A5C" />
        </View>
      ) : filteredClothes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText || getFilterCount() > 0 
              ? 'Aucun vêtement ne correspond à votre recherche' 
              : 'Votre garde-robe est vide'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchText || getFilterCount() > 0
              ? 'Essayez avec d\'autres termes ou filtres'
              : 'Commencez à ajouter vos vêtements en appuyant sur le bouton +'}
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredClothes}
          renderItem={({ item }) => (
            <ClotheView 
              clothingItem={item}
              showMatchStatus={enableMatching}
              userWardrobeItems={selectedClothes.length > 0 ? 
                clothes.filter(c => selectedClothes.includes(c.id)) : 
                undefined}
              selectable={true}
              selected={selectedClothes.includes(item.id)}
              onSelectToggle={toggleSelection}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97A5C']} />
          }
        />
      )}

      <ClotheFilterModal 
        visible={showFilterModal}
        onClose={handleFilterModalClose}
        onApplyFilters={handleApplyFilters}
        clothes={clothes}
        currentFilters={advancedFilters}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedClothes.length === 0 && styles.confirmButtonDisabled
          ]}
          onPress={confirmSelection}
          disabled={selectedClothes.length === 0}
        >
          <Text style={styles.confirmButtonText}>
            Confirmer la sélection ({selectedClothes.length})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterIconButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F97A5C',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
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
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
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
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 80, // Espace pour le bouton de confirmation
  },
  clothingItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#F97A5C',
  },
  clothingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  clothingInfo: {
    flex: 1,
  },
  clothingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clothingBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clothingColor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkboxContainer: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  checkboxChecked: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#F97A5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#F97A5C',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 