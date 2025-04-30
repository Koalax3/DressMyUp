import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useOutfit } from '@/contexts/OutfitContext';
import { useFilter } from '@/contexts/FilterContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import OutfitPreview from '@/components/OutfitPreview';
import OutfitFilterModal from '@/components/OutfitFilterModal';
import { useAuth } from '@/contexts/AuthContext';
import { OutfitService } from '@/services';
import { Outfit } from '@/types';
import SearchBar from './SearchBar';
import OptionsButton from './OptionsButton';

export default function OutfitView() {
  const { user } = useAuth();
  const { outfits, isLoading, hasOutfits } = useOutfit();
  const { 
    outfitFilters,
    setOutfitFilters,
    showOutfitFilterModal,
    setShowOutfitFilterModal,
    searchText,
    setSearchText
  } = useFilter();
  
  const [filteredOutfits, setFilteredOutfits] = React.useState<Outfit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const fetchOutfits = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: userOutfits, error: userOutfitsError } = await OutfitService.fetchOutfitsForWardrobe(user.id)
      if (userOutfitsError) {
        console.error('Erreur lors de la récupération des tenues:', userOutfitsError);
      }
      if(userOutfits) {
        applyOutfitFilters(userOutfits, searchText);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOutfits();
  };

  const applyOutfitFilters = (
    items: Outfit[],
    search: string
  ) => {
    let filtered = [...items];
    
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (outfitFilters.seasons.length > 0) {
      filtered = filtered.filter(item => 
        item.season && outfitFilters.seasons.includes(item.season)
      );
    }
    
    if (outfitFilters.occasions.length > 0) {
      filtered = filtered.filter(item => 
        item.occasion && outfitFilters.occasions.includes(item.occasion)
      );
    }
    
    if (outfitFilters.genders.length > 0) {
      filtered = filtered.filter(item => 
        item.gender && outfitFilters.genders.includes(item.gender)
      );
    }
    
    if (!outfitFilters.withFavorites) {
      filtered = filtered.filter(item => 
        item.user_id === user?.id
      );
    }
    
    setFilteredOutfits(filtered);
  };

  React.useEffect(() => {
    if (outfits.length > 0) {
      applyOutfitFilters(outfits, searchText);
    } else {
      setFilteredOutfits([]);
    }
  }, [outfits, searchText, outfitFilters]);

  React.useEffect(() => {
    fetchOutfits();
  }, []);

  const openOutfitFilterModal = () => {
    setShowOutfitFilterModal(true);
  };

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
          <OptionsButton openFilterModal={openOutfitFilterModal} filterType="outfit" />
        </View>
      </View>

      {outfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.main }]}>
            Vous n'avez pas encore de tenues
          </Text>
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary.main }]}
            onPress={() => router.push('/create')}
          >
            <Text style={[styles.createButtonText, { color: colors.white }]}>
              Créer ma première tenue
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <FlatList
            data={filteredOutfits}
            renderItem={({ item }) => (
              <OutfitPreview outfit={item} />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.outfitList}
            columnWrapperStyle={{ justifyContent: 'space-between', gap: 10 }}
          />
        </View>
      )}

      <OutfitFilterModal 
        visible={showOutfitFilterModal}
        onClose={() => setShowOutfitFilterModal(false)}
        onApplyFilters={setOutfitFilters}
        currentFilters={outfitFilters}
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
  filterIconButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
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
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  outfitList: {
    padding: 8,
    marginHorizontal: 'auto',
  },
}); 