import React, { createContext, useState, useContext, useCallback, useEffect, ReactNode } from 'react';
import { ClothingItem, Outfit, User } from '@/types';
import { useAuth } from './AuthContext';
import { useClothing } from './ClothingContext';
import { fetchOutfitsForExplore, fetchLikedOutfitIds, getIdOutfitFromClothe } from '@/services/outfitService';
import { FilterConstraint } from '@/services/supabaseService';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@/i18n/useTranslation';
import { useOutfit } from './OutfitContext';

// Type pour les outfits avec les informations utilisateur
export type OutfitWithUser = Outfit & { user: User } & { clothes: ClothingItem[] };

// Types pour les filtres disponibles
export type FilterCategory = 'season' | 'occasion' | 'gender';

// Interface pour notre contexte
interface ExplorerFilterContextType {
  outfits: OutfitWithUser[];
  filteredOutfits: OutfitWithUser[];
  loading: boolean;
  refreshing: boolean;
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
  showFavorites: boolean;
  showDressMatch: boolean;
  activeFilterCategory: FilterCategory | null;
  filters: {
    season: string;
    occasion: string;
    gender: string;
  };
  setShowFavorites: (show: boolean) => void;
  setShowDressMatch: (show: boolean) => void;
  toggleFilterCategory: (category: FilterCategory) => void;
  updateFilter: (category: FilterCategory, value: string) => void;
  resetFilters: () => void;
  loadOutfits: (pageNumber?: number, shouldAppend?: boolean) => Promise<void>;
  refreshOutfits: () => void;
  hasActiveFilters: () => boolean;
}

// Création du contexte
const ExplorerFilterContext = createContext<ExplorerFilterContextType | undefined>(undefined);

// Fournisseur du contexte
export const ExplorerFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { clothes } = useClothing();
  const { getUserPreferences } = useAuth();
  const { clothesExploreOutfit, setClothesExploreOutfit } = useOutfit();
  const { t } = useTranslation();
  const [outfits, setOutfits] = useState<OutfitWithUser[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<OutfitWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showDressMatch, setShowDressMatch] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory | null>(null);
  const [filters, setFilters] = useState({
    season: 'all',
    occasion: 'fav',
    gender: 'all'
  });
  const [currentFilters, setCurrentFilters] = useState<string>('');
  const ITEMS_PER_PAGE = 10;

  // Récupérer les IDs des favoris une seule fois
  const getLikedOutfitIds = useCallback(async () => {
    if (!user || !showFavorites) return [];
    return await fetchLikedOutfitIds(user.id);
  }, [user, showFavorites]);

  // Fonction pour construire les options de filtre
  const buildFilterOptions = useCallback(async () => {
    const filterOptions: FilterConstraint[] = [];
    
    if (filters.season !== 'all') {
      filterOptions.push(['eq', 'season', filters.season]);
    }
    
    if (filters.occasion !== 'all') {
      if (filters.occasion === 'fav' && user?.id) {
        const preferences = await getUserPreferences();
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

    if (clothesExploreOutfit.length > 0) {
        const {data} = await getIdOutfitFromClothe(clothesExploreOutfit);
        if (data) {
            const outfitsIds = data.map(clothe => {
                if(clothe.clothes_outfits && clothe.clothes_outfits.length > 0) {
                  return clothe.clothes_outfits[0].outfit_id;
                }
                return null;
            }).filter(id => id !== null);
            console.log(outfitsIds);
            if (outfitsIds.length > 0) {
                filterOptions.push(['in', 'id', outfitsIds]);
            }
            else {
                filterOptions.push(['eq', 'id', 'b2f33c5f-e8af-4a1e-b883-4caadecafa41']);
            }
        }
    }

    if (showDressMatch) {
      if (!user) return filterOptions;
      const {data} = await getIdOutfitFromClothe(clothes);
      if (data) {
        const outfitsIds = data.map(clothe => {
          if(clothe.clothes_outfits && clothe.clothes_outfits.length > 0) {
            return clothe.clothes_outfits[0].outfit_id;
          }
          return null;
        }).filter(id => id !== null);
        console.log(outfitsIds);
        if (outfitsIds.length > 0) {
          filterOptions.push(['in', 'id', outfitsIds]);
        } else {
          Toast.show({
            type: 'error',
            text1: t('explore.noDressMatchOutfitsFound')
          });
        }
      }
    }

    if (showFavorites) {
      const ids = await getLikedOutfitIds();
      if (ids.length === 0) {
        return null;
      }
      filterOptions.push(['in', 'id', ids]);
    }

    return filterOptions;
  }, [filters, showFavorites, getLikedOutfitIds, showDressMatch, clothes, user, t, clothesExploreOutfit]);

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
      
      // Éviter les requêtes redondantes
      const filterString = JSON.stringify(filterOptions);
      if (currentFilters === filterString && !shouldAppend && !refreshing) {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        return;
      }
      
      setCurrentFilters(filterString);
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
  }, [user, buildFilterOptions, outfits, loadingMore, hasMore, t, currentFilters, refreshing, clothesExploreOutfit]);

  // Méthode pour rafraîchir les outfits
  const refreshOutfits = useCallback(() => {
    setRefreshing(true);
    loadOutfits(1, false);
  }, [loadOutfits]);

  // Effets pour charger les outfits à l'initialisation ou au changement de filtres
  useEffect(() => {
    loadOutfits(1, false);
  }, [filters, showFavorites, showDressMatch, clothesExploreOutfit]);

  // Méthode pour vérifier si des filtres sont actifs
  const hasActiveFilters = useCallback(() => {
    return filters.season !== 'all' || filters.occasion !== 'fav' || filters.gender !== 'all' || clothesExploreOutfit.length > 0 || showDressMatch || showFavorites;
  }, [filters, clothesExploreOutfit, showDressMatch, showFavorites]);

  // Méthode pour réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      season: 'all',
      occasion: 'fav',
      gender: 'all'
    });
    setShowFavorites(false);
    setShowDressMatch(false);
    setActiveFilterCategory(null);
    setClothesExploreOutfit([]);
  }, []);

  // Méthode pour mettre à jour un filtre
  const updateFilter = useCallback((category: FilterCategory, value: string) => {
    setFilters(prev => ({ ...prev, [category]: value }));
  }, []);

  // Méthode pour basculer une catégorie de filtre
  const toggleFilterCategory = useCallback((category: FilterCategory) => {
    setActiveFilterCategory(prev => prev === category ? null : category);
  }, []);

  // Valeur du contexte
  const value: ExplorerFilterContextType = {
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
    hasActiveFilters
  };

  return (
    <ExplorerFilterContext.Provider value={value}>
      {children}
    </ExplorerFilterContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useExplorerFilter = () => {
  const context = useContext(ExplorerFilterContext);
  if (context === undefined) {
    throw new Error('useExplorerFilter doit être utilisé à l\'intérieur d\'un ExplorerFilterProvider');
  }
  return context;
}; 