import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import { useClothing } from '@/contexts/ClothingContext';
import { useFilter } from '@/contexts/FilterContext';
import { ClothingItem } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ClotheItem from '@/components/ClotheItem';
import ClotheFilterModal from '@/components/ClotheFilterModal';
import { COLORS } from '@/constants/Clothes';
import { FilterConstraint } from '@/services/supabaseService';
import { ClothingService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useScroll } from '@/contexts/ScrollContext';
import { Animated, RefreshControl } from 'react-native';
import SearchBar from './SearchBar';
import OptionsButton from './OptionsButton';

export default function ClothingView() {
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const { 
    clothesFilter,
    setClothesFilter,
    clothesAdvancedFilters: advancedFilters,
    setClothesAdvancedFilters: setAdvancedFilters,
    showClothesFilterModal: showFilterModal,
    setShowClothesFilterModal: setShowFilterModal,
    getClothesFilterCount,
    searchText,
    setSearchText
  } = useFilter();
  
  const { clothes, refreshing: refreshingClothes, setRefreshing: setRefreshingClothes } = useClothing();
  const [filteredClothes, setFilteredClothes] = React.useState<ClothingItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const clothesListRef = React.useRef<Animated.FlatList<ClothingItem>>(null);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const fetchClothes = async () => {
    if (!user) return;
    const filters = [] as FilterConstraint[];
    if (clothesFilter)
      filters.push(['eq', 'type', clothesFilter]);

    try {
      setLoading(true);
      const clothes = await ClothingService.fetchUserClothes(user.id);
      applyFilters(clothes || [], searchText, clothesFilter, advancedFilters);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setRefreshingClothes(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClothes();
  };

  useEffect(() => {
    if (clothes.length > 0) {
      applyFilters(clothes, searchText, clothesFilter, advancedFilters);
      setLoading(false);
    }
  }, [clothes, searchText, clothesFilter, advancedFilters]);

  useEffect(() => {
    if (refreshing) {
      fetchClothes();
    }
  }, [refreshing]);

  const applyFilters = (
    items: ClothingItem[], 
    search: string, 
    typeFilter: string | null, 
    filters: any
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
          const selectedColorIds = filters.colors.map((colorName: string) => {
            const colorObj = COLORS.find(c => c.name.toLowerCase().includes(colorName.toLowerCase()));
            return colorObj ? colorObj.id : null;
          }).filter((id: string | null) => id !== null);
          
          return selectedColorIds.every((colorId: string) => 
            item.color.toLowerCase().includes(colorId.toLowerCase())
          );
        });
      } else {
        filtered = filtered.filter(item => {
          const selectedColorIds = filters.colors.map((colorName: string) => {
            const colorObj = COLORS.find(c => c.name.toLowerCase().includes(colorName.toLowerCase()));
            return colorObj ? colorObj.id : null;
          }).filter((id: string | null) => id !== null);
          
          return selectedColorIds.some((colorId: string) => 
            item.color.toLowerCase().includes(colorId.toLowerCase())
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
  };

  const openFilterModal = () => {
    setShowFilterModal(true);
  };

  const FilterButton = ({ title, value }: { title: string; value: string | null }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: colors.gray },
        clothesFilter === value && styles.filterButtonActive,
      ]}
      onPress={() => setClothesFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: colors.text.main },
          clothesFilter === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchBar searchText={searchText} setSearchText={setSearchText} />
          <OptionsButton openFilterModal={openFilterModal} filterType="clothes" />
        </View>
      </View>

      <View>
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

      {filteredClothes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={80} color={colors.darkGray} />
          <Text style={[styles.emptyText, { color: colors.text.main }]}>
            {searchText || getClothesFilterCount() > 0 
              ? 'Aucun vêtement ne correspond à votre recherche' 
              : 'Votre garde-robe est vide'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text.light }]}>
            {searchText || getClothesFilterCount() > 0
              ? 'Essayez avec d\'autres termes ou filtres'
              : 'Commencez à ajouter vos vêtements en appuyant sur le bouton +'}
          </Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}

      <ClotheFilterModal 
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={setAdvancedFilters}
        clothes={clothes}
        currentFilters={advancedFilters}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  filterButtonTextActive: {
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
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 15,
  },
}); 