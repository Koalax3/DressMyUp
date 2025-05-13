import React, { useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OutfitPreview from '@/components/OutfitPreview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { genders, seasons, STYLES } from '@/constants/Outfits';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import Header from '@/components/Header';
import GenericSelector from '@/components/selector/GenericSelector';
import { useTranslation } from '@/i18n/useTranslation';
import DressMatchIcon from '@/assets/images/dress-match.svg';
import { useClothing } from '@/contexts/ClothingContext';
import { useExplorerFilter, FilterCategory } from '@/contexts/ExplorerFilterContext';
import { useMemo } from 'react';
import { Outfit } from '@/types';
import { router } from 'expo-router';
import { useOutfit } from '@/contexts/OutfitContext';

export default function ExploreScreen() {
  const { 
    outfits, 
    filteredOutfits, 
    loading, 
    refreshing, 
    page, 
    hasMore, 
    loadingMore,
    showFavorites,
    showDressMatch,
    activeFilterCategory,
    filters,
    setShowFavorites,
    setShowDressMatch,
    toggleFilterCategory,
    updateFilter,
    resetFilters,
    loadOutfits,
    refreshOutfits,
    hasActiveFilters,
  } = useExplorerFilter();
  const { hasClothesExplore } = useOutfit();
  const { t } = useTranslation();
  const { clothes } = useClothing();
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

  const handleToggleFilterCategory = (category: FilterCategory) => {
    toggleFilterCategory(category);
    
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

  const renderOutfitItem = ({ item }: { item: Outfit }) => (
    <OutfitPreview outfit={item} userWardrobe={clothes} />
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
              {t(`${category}s.${option.value}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title={t('navigation.explore')}>
        {hasActiveFilters() && filteredOutfits.length > 0 && (
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
          <TouchableOpacity
            style={[
              styles.filterCategory, 
              { 
                backgroundColor: hasClothesExplore 
                  ? colors.primary.main 
                  : colors.gray
              }
            ]}
            onPress={() => router.push({ pathname: '/wardrobe/select', params: { mode: 'explore' } })}
          >
            <MaterialCommunityIcons 
              name="hanger" 
              size={16} 
              color={hasClothesExplore 
                ? colors.white 
                : colors.text.main
              } 
            />
            <Text 
              style={[
                styles.filterCategoryText, 
                { 
                  color: hasClothesExplore 
                    ? colors.white 
                    : colors.text.main 
                }
              ]}
            >
              {t('explore.wardrobe')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterCategory, 
              { 
                backgroundColor: showDressMatch 
                  ? colors.primary.main 
                  : colors.gray
              }
            ]}
            onPress={() => setShowDressMatch(!showDressMatch)}
          >
            <DressMatchIcon
              width={16}
              height={16}
              fill={isDarkMode || showDressMatch ? colors.white : colors.text.main} />
            <Text 
              style={[
                styles.filterCategoryText, 
                { 
                  color: showDressMatch 
                    ? colors.white 
                    : colors.text.main,
                }
              ]}
            >
              {t('common.dressMatch')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterCategory, 
              { 
                backgroundColor: activeFilterCategory === 'season' 
                  ? colors.primary.main 
                  : colors.gray 
              }
            ]}
            onPress={() => handleToggleFilterCategory('season')}
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
            {(setModalVisible) => {
              // Stocker la référence pour l'ouvrir programmatiquement plus tard
              if (setStyleModalVisible.current !== setModalVisible) {
                setStyleModalVisible.current = setModalVisible;
              }
              
              return (
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
                    handleToggleFilterCategory('occasion');
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
              );
            }}
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
            onPress={() => handleToggleFilterCategory('gender')}
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
          contentContainerStyle={[styles.outfitList, { flex: filteredOutfits.length > 0 ? 0 : 1 }]}
          columnWrapperStyle={{ justifyContent: 'space-between', gap: 10 }}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshOutfits}
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
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={colors.darkGray} />
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
    position: 'relative',
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