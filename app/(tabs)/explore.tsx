import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useScroll } from '@/contexts/ScrollContext';
import { ClothingItem, Outfit, User } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import OutfitPreview from '@/components/OutfitPreview';
import { fetchOutfitsForExplore, fetchLikedOutfitIds } from '@/services/outfitService';
import { fetchUserClothes } from '@/services/clothingService';
import { Ionicons } from '@expo/vector-icons';
import { genders, seasons, STYLES } from '@/constants/Outfits';
import { FilterConstraint } from '@/services/supabaseService';
import { getPreferences } from '@/services/preferencesService';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import Header from '@/components/Header';
import GenericSelector from '@/components/selector/GenericSelector';
import { useTranslation } from '@/i18n/useTranslation';

// Type simplifié pour l'affichage des tenues
type OutfitWithUser = Outfit & { user: User } & { clothes: ClothingItem[] };

// Types de filtres disponibles
type FilterCategory = 'season' | 'occasion' | 'gender';
type FilterValue = string | null;

export default function ExploreScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [outfits, setOutfits] = useState<OutfitWithUser[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<OutfitWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const [clothesUser, setClothesUser] = useState<ClothingItem[]>([]);
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory | null>(null);
  const [filters, setFilters] = useState({
    season: 'all',
    occasion: 'fav',
    gender: 'all'
  });
  const [modalVisible, setModalVisible] = useState(false);
  const setStyleModalVisible = useRef<((visible: boolean) => void) | null>(null);
  
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  // Construction des options de filtres avec i18n
  const filterOptions = useMemo(() => ({
    season: Object.keys(seasons).map(season => ({
      key: season,
      value: season,
      label: seasons[season]
    })),
    occasion: [
      { key: 'all', value: 'all', label: t('explore.allStyles') },
      { key: 'fav', value: 'fav', label: t('explore.myStyles') },
      ...STYLES.map(style => ({
        key: style.id,
        value: style.id,
        label: t(`styles.${style.id}`)
      }))
    ],
    gender: [
      { key: 'all', value: 'all', label: t('explore.allGenders') },
      ...Object.keys(genders).map(gender => ({
        key: gender,
        value: gender,
        label: genders[gender]
      }))
    ]
  }), [t]);

  // Récupérer les IDs des favoris une seule fois et les mettre en cache
  const likedOutfitIds = useMemo(async () => {
    if (!user || !showFavorites) return [];
    return await fetchLikedOutfitIds(user.id);
  }, [user, showFavorites]);

  useEffect(() => {
    const fetchClothesUser = async () => {
      if (!user) return;
      const clothes = await fetchUserClothes(user.id, []);
      setClothesUser(clothes);
    };
    fetchClothesUser();
  }, [user]);

  // Fonction pour construire les options de filtre
  const buildFilterOptions = useCallback(async () => {
    const filterOptions: FilterConstraint[] = [];
    
    if (filters.season !== 'all') {
      filterOptions.push(['eq', 'season', filters.season]);
    }
    
    if (filters.occasion !== 'all') {
      if (filters.occasion === 'fav' && user?.id) {
        const preferences = await getPreferences(user.id);
        if (preferences) {
          filterOptions.push(['in', 'occasion', preferences.styles]);
        }
      } else {
        filterOptions.push(['eq', 'occasion', filters.occasion]);
      }
    }
    
    if (filters.gender !== 'all') {
      filterOptions.push(['eq', 'gender', filters.gender]);
    }

    if (showFavorites) {
      const ids = await likedOutfitIds;
      if (ids.length === 0) {
        return null;
      }
      filterOptions.push(['in', 'id', ids]);
    }

    return filterOptions;
  }, [filters, showFavorites, likedOutfitIds]);

  // Fonction pour charger les tenues
  const loadOutfits = useCallback(async (pageNumber = 1, shouldAppend = false) => {
    if (!user) return;
    
    if (shouldAppend) {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const filterOptions = await buildFilterOptions();
      
      if (filterOptions === null) {
        setOutfits([]);
        setFilteredOutfits([]);
        setHasMore(false);
        return;
      }

      const response = await fetchOutfitsForExplore(user.id, pageNumber, ITEMS_PER_PAGE, filterOptions);
      
      if (!response) {
        console.error(t('errors.noResponse'));
        return;
      }
      
      if (response.error) {
        console.error(t('errors.fetchOutfits'), response.error);
      } else {
        const outfitsData = response.data as OutfitWithUser[] || [];
        
        if (shouldAppend) {
          const newOutfits = outfitsData.filter(newOutfit => 
            !outfits.some(existingOutfit => existingOutfit.id === newOutfit.id)
          );
          setOutfits(prev => [...prev, ...newOutfits]);
          setFilteredOutfits(prev => [...prev, ...newOutfits]);
          setPage(pageNumber);
        } else {
          setOutfits(outfitsData);
          setFilteredOutfits(outfitsData);
          setPage(1);
        }
        
        setHasMore(outfitsData.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error(t('errors.generic'), error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [user, buildFilterOptions, outfits, loadingMore, hasMore, t]);

  // Effet pour gérer les changements de filtres
  useEffect(() => {
    loadOutfits(1, false);
  }, [filters, showFavorites]);

  // Effet pour recharger les données quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      if (user) {
        const reloadData = async () => {
          const filterOptions = await buildFilterOptions();
          if (filterOptions === null) {
            setOutfits([]);
            setFilteredOutfits([]);
            setHasMore(false);
            return;
          }

          const response = await fetchOutfitsForExplore(user.id, 1, ITEMS_PER_PAGE, filterOptions);
          
          if (!response) {
            console.error(t('errors.noResponse'));
            return;
          }
          
          if (response.error) {
            console.error(t('errors.fetchOutfits'), response.error);
          } else {
            const outfitsData = response.data as OutfitWithUser[] || [];
            setOutfits(outfitsData);
            setFilteredOutfits(outfitsData);
            setPage(1);
            setHasMore(outfitsData.length === ITEMS_PER_PAGE);
          }
        };

        reloadData();
      }
    }, [user, buildFilterOptions, t])
  );

  // Mettre à jour un filtre
  const updateFilter = (category: FilterCategory, value: string) => {
    setFilters(prev => ({ ...prev, [category]: value }));
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFilters({
      season: 'all',
      occasion: 'fav',
      gender: 'all'
    });
    setShowFavorites(false);
    setActiveFilterCategory(null);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return filters.season !== 'all' || filters.occasion !== 'fav' || filters.gender !== 'all';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOutfits(1, false);
  };

  const toggleFilterCategory = (category: FilterCategory) => {
    setActiveFilterCategory(activeFilterCategory === category ? null : category);
    
    // Si on vient de sélectionner la catégorie 'occasion', ouvrir automatiquement le sélecteur de style
    if (category === 'occasion' && activeFilterCategory !== 'occasion' && setStyleModalVisible.current) {
      // On attend un peu que le rendu soit terminé avant d'ouvrir le modal
      setTimeout(() => {
        if (setStyleModalVisible.current) {
          setStyleModalVisible.current(true);
        }
      }, 100);
    }
  };

  const renderOutfitItem = ({ item }: { item: OutfitWithUser }) => (
    <OutfitPreview outfit={item} userWardrobe={clothesUser} />
  );

  const renderFilterOptions = (category: FilterCategory) => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterOptionsContainer}
      >
        {filterOptions[category].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterOption,
              { 
                backgroundColor: colors.gray,
                borderColor: colors.gray 
              },
              filters[category] === option.value && {
                backgroundColor: colors.primary.main,
                borderColor: colors.primary.main
              }
            ]}
            onPress={() => updateFilter(category, option.value)}
          >
            <Text 
              style={[
                styles.filterOptionText,
                { color: colors.text.main },
                filters[category] === option.value && { color: colors.white }
              ]}
            >
              {t(`${category}.${option.value}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title={t('navigation.explore')}>
        {hasActiveFilters() && (
          <TouchableOpacity onPress={resetFilters} style={{...styles.resetButton, backgroundColor:colors.gray}}>
            <Text style={[styles.resetButtonText, { color: colors.primary.main }]}>{t('common.reset')}</Text>
          </TouchableOpacity>
        )}
      </Header>

      <View style={{...styles.filtersContainer}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterCategoriesContainer}>
          <TouchableOpacity
            style={[
              styles.filterCategory, 
              { 
                backgroundColor: activeFilterCategory === 'season' 
                  ? colors.primary.main 
                  : colors.gray 
              }
            ]}
            onPress={() => toggleFilterCategory('season')}
          >
            <Ionicons 
              name="sunny-outline" 
              size={16} 
              color={activeFilterCategory === 'season' 
                ? colors.white 
                : colors.text.main
              } 
            />
            <Text 
              style={[
                styles.filterCategoryText, 
                { 
                  color: activeFilterCategory === 'season' 
                    ? colors.white 
                    : colors.text.main 
                }
              ]}
            >
              {t('clothing.season')}
            </Text>
          </TouchableOpacity>

          <GenericSelector
            options={filterOptions['occasion']}
            selectedOption={filters['occasion']}
            onOptionSelect={(option) => updateFilter('occasion', option as string)}
            title={t('explore.styles')}
            searchable={true}
            searchPlaceholder={t('explore.searchStyle')}
          >
            {(setModalVisible) => (
              <TouchableOpacity
                style={[
                  styles.filterCategory, 
                  { 
                    backgroundColor: activeFilterCategory === 'occasion' 
                      ? colors.primary.main 
                      : colors.gray 
                  }
                ]}
                onPress={() => {
                  toggleFilterCategory('occasion');
                  setModalVisible(true);
                }}
              >
                <Ionicons 
                  name="shirt-outline" 
                  size={16} 
                  color={activeFilterCategory === 'occasion' 
                    ? colors.white 
                    : colors.text.main
                  } 
                />
                <Text 
                  style={[
                    styles.filterCategoryText, 
                    { 
                      color: activeFilterCategory === 'occasion' 
                        ? colors.white 
                        : colors.text.main 
                    }
                  ]}
                >
                  {t('explore.style')}
                </Text>
              </TouchableOpacity>
            )}
          </GenericSelector>

          <TouchableOpacity
            style={[
              styles.filterCategory, 
              { 
                backgroundColor: activeFilterCategory === 'gender' 
                  ? colors.primary.main 
                  : colors.gray
              }
            ]}
            onPress={() => toggleFilterCategory('gender')}
          >
            <Ionicons 
              name="people-outline" 
              size={16} 
              color={activeFilterCategory === 'gender' 
                ? colors.white 
                : colors.text.main
              } 
            />
            <Text 
              style={[
                styles.filterCategoryText, 
                { 
                  color: activeFilterCategory === 'gender' 
                    ? colors.white 
                    : colors.text.main 
                }
              ]}
            >
              {t('explore.gender')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterCategory, 
              { 
                backgroundColor: showFavorites 
                  ? colors.primary.main 
                  : colors.gray
              }
            ]}
            onPress={() => setShowFavorites(!showFavorites)}
          >
            <Ionicons 
              name={showFavorites ? "heart" : "heart-outline"} 
              size={16} 
              color={showFavorites 
                ? colors.white 
                : colors.text.main
              } 
            />
            <Text 
              style={[
                styles.filterCategoryText, 
                { 
                  color: showFavorites 
                    ? colors.white 
                    : colors.text.main 
                }
              ]}
            >
              {t('explore.favorites')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {activeFilterCategory && activeFilterCategory !== 'occasion' && (
        <View>
          {renderFilterOptions(activeFilterCategory)}
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={filteredOutfits}
          renderItem={renderOutfitItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.outfitList}
          columnWrapperStyle={{ justifyContent: 'space-between', gap: 10 }}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              loadOutfits(page + 1, true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.primary.main} />
              </View>
            ) : (
              filters.occasion === 'fav' ? <View style={styles.loadingMoreContainer}>
                <TouchableOpacity onPress={() => setFilters({...filters, occasion: 'all'})} style={[styles.createButton, { backgroundColor: colors.primary.main }]}>
                  <Text style={styles.createButtonText}>{t('explore.showMoreOutfits')}</Text>
                </TouchableOpacity>
              </View> : null
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={colors.text.light} />
              <Text style={[styles.emptyText, { color: colors.text.main }]}>
                {t('explore.noOutfitsFound')}
              </Text>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary.main }]}
                onPress={() => {
                  resetFilters();
                  loadOutfits(1, false);
                }}
              >
                <Text style={styles.createButtonText}>{t('common.reset')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  resetButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  filtersContainer: {
    paddingTop: 15,
    paddingBottom: 5,
  },
  filterCategoriesContainer: {
    paddingHorizontal: 15,
  },
  filterCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  filterCategoryText: {
    fontSize: 14,
    marginLeft: 5,
  },
  filterOptionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
  },
  outfitList: {
    padding: 8,
    marginHorizontal: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  styleButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 