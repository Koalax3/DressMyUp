import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ClothingItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClotheFilterModal, { ClotheFilters as Filters } from '../../components/ClotheFilterModal';
import { types } from '../../constants/Clothes';
import ClotheView from '@/components/ClotheView';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import SearchBar from '@/components/SearchBar';
import { useOutfit } from '@/contexts/OutfitContext';
import { useTranslation } from 'react-i18next';
import { useClothing } from '@/contexts/ClothingContext';

type WardrobeSelectParams = {
  multiple?: string;
  enableMatching?: string;
  initialSelected?: string;
  formName?: string;
  formDescription?: string;
  formSeason?: string;
  formOccasion?: string;
  formImage?: string;
  mode?: 'create' | 'explore';
};

export default function WardrobeSelectScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const params = useLocalSearchParams<WardrobeSelectParams>();
  const { clothescreateOutfit, setClothescreateOutfit, clothesExploreOutfit, setClothesExploreOutfit } = useOutfit();
  const { clothes: userClothes, isLoading: clothesLoading, refreshClothes } = useClothing();
  const enableMatching = params.enableMatching === 'true';
  
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<Filters>({
    brands: [],
    colors: [],
    patterns: [],
    materials: [],
    colorFilterMode: 'differentItems'
  });
  const [selectedClothes, setSelectedClothes] = useState<string[]>(
    params.mode === 'create' ? clothescreateOutfit.map(clothe => clothe.id) : clothesExploreOutfit.map(clothe => clothe.id)
  );
  const { t } = useTranslation();
  
  // Appliquer les filtres aux vêtements
  const applyFilters = (
    items: ClothingItem[], 
    search: string, 
    typeFilter: string | null, 
    filters: Filters
  ) => {
    let filtered = [...items];
    
    if (typeFilter) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.brand && item.brand.toLowerCase().includes(searchLower)) ||
        item.color.toLowerCase().includes(searchLower)
      );
    }

    if (filters.brands.length > 0) {
      filtered = filtered.filter(item => 
        item.brand && filters.brands.includes(item.brand)
      );
    }

    if (filters.colors.length > 0) {
      const colorFilterMode = filters.colorFilterMode || 'differentItems';
      
      if (colorFilterMode === 'sameItem') {
        filtered = filtered.filter(item => {
          const selectedColorIds = filters.colors;
          
          return selectedColorIds.every(colorId => 
            item.color.toLowerCase().includes(colorId.toLowerCase() || '')
          );
        });
      } else {
        filtered = filtered.filter(item => {
          const selectedColorIds = filters.colors;
          
          return selectedColorIds.some(colorId => 
            item.color.toLowerCase().includes(colorId.toLowerCase() || '')
          );
        });
      }
    }

    if (filters.patterns && filters.patterns.length > 0) {
      filtered = filtered.filter(item => 
        item.pattern && filters.patterns.includes(item.pattern)
      );
    }

    if (filters.materials && filters.materials.length > 0) {
      filtered = filtered.filter(item => 
        item.material && filters.materials.includes(item.material)
      );
    }

    setFilteredClothes(filtered);
    setLoading(false);
  };

  // Effet pour appliquer les filtres à chaque changement
  useEffect(() => {
    if (userClothes.length > 0) {
      applyFilters(userClothes, searchText, typeFilter, advancedFilters);
    }
  }, [searchText, typeFilter, advancedFilters, userClothes]);

  // Effet pour initialiser les vêtements filtrés
  useEffect(() => {
    if (!clothesLoading) {
      applyFilters(userClothes, searchText, typeFilter, advancedFilters);
    }
  }, [clothesLoading, userClothes]);

  // Focus effect pour recharger les données
  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      applyFilters(userClothes, searchText, typeFilter, advancedFilters);
    }, [user, userClothes])
  );

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    applyFilters(userClothes, text, typeFilter, advancedFilters);
  };

  const handleApplyFilters = (newFilters: Filters) => {
    setAdvancedFilters(newFilters);
    applyFilters(userClothes, searchText, typeFilter, newFilters);
  };

  const onRefresh = () => {
    setRefreshing(true);
    refreshClothes().then(() => {
      setRefreshing(false);
    });
  };

  const openFilterModal = () => {
    setShowFilterModal(true);
  };

  const toggleSelection = (id: string) => {
    setSelectedClothes(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  const confirmSelection = () => {
    if (params.mode === 'create') {
      setClothescreateOutfit(selectedClothes.map(id => userClothes.find(c => c.id === id)!));
    } else if (params.mode === 'explore') {
      setClothesExploreOutfit(selectedClothes.map(id => userClothes.find(c => c.id === id)!));
    }
    router.back();
  };

  const getFilterCount = () => {
    return advancedFilters.brands.length + advancedFilters.colors.length + advancedFilters.patterns.length + advancedFilters.materials.length;
  };

  const handleTypeFilterChange = (newType: string | null) => {
    setTypeFilter(newType);
    applyFilters(userClothes, searchText, newType, advancedFilters);
  };

  const FilterButton = ({ title, value }: { title: string; value: string | null }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: colors.gray },
        value === typeFilter && styles.filterButtonActive,
      ]}
      onPress={() => {
        setTypeFilter(value);
        applyFilters(userClothes, searchText, value, advancedFilters);
      }}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: colors.text.main },
          value === typeFilter && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleFilterModalClose = (newFilters?: Filters) => {
    if (newFilters) {
      setAdvancedFilters(newFilters);
      applyFilters(userClothes, searchText, typeFilter, newFilters);
    }
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTypeFilter(null);
    setSearchText('');
    setAdvancedFilters({ brands: [], colors: [], patterns: [], materials: [], colorFilterMode: 'differentItems' });
    setFilteredClothes(userClothes);
  };

  const renderTypeFilters = () => {
    if (!types || typeof types !== 'object') {
      console.error('La variable types est undefined ou n\'est pas un objet');
      return null;
    }
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeFiltersContainer}
      >
        <FilterButton title={t('common.all')} value={null} />
        {Object.entries(types).map(([key, value]) => (
          <FilterButton key={key} title={t(`clothingTypes.${key}`)} value={key} />
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.main} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.main }]}>{t('outfit.selectedClothes')}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <SearchBar searchText={searchText} setSearchText={setSearchText} />
          <TouchableOpacity 
            style={[styles.filterIconButton, { backgroundColor: colors.gray }]}
            onPress={openFilterModal}
          >
            <Ionicons name="options-outline" size={24} color={colors.primary.main} />
            {getFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.typeFilters}>
        {renderTypeFilters()}
      </View>

      {loading || clothesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : filteredClothes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={80} color={colors.text.lighter} />
          <Text style={[styles.emptyText, { color: colors.text.main }]}>
            {searchText || getFilterCount() > 0 
              ? t('common.noClothesFound')
              : t('common.emptyWardrobe')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.lighter }]}>
            {searchText || getFilterCount() > 0
              ? t('common.tryOtherTermsOrFilters')
              : t('common.startAddingClothes')}
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
                userClothes.filter(c => selectedClothes.includes(c.id)) : 
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
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[colors.primary.main]} 
            />
          }
        />
      )}

      <ClotheFilterModal 
        visible={showFilterModal}
        onClose={handleFilterModalClose}
        onApplyFilters={handleApplyFilters}
        clothes={userClothes}
        currentFilters={advancedFilters}
      />

      <View style={[styles.footer, { backgroundColor: colors.background.main, borderTopColor: isDarkMode ? '#333' : '#eee' }]}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
          ]}
          onPress={confirmSelection}
        >
          <Text style={styles.confirmButtonText}>
            {t('common.confirm')} ({selectedClothes.length})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filterIconButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 8,
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
  typeFilters: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  typeFiltersContainer: {
    flexDirection: 'row',
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
    paddingBottom: 80,
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
    color: '#ffffff',
  },
}); 