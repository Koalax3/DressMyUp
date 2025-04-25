import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ClotheFilters as Filters } from '@/components/ClotheFilterModal';
import { OutfitFilters } from '@/components/OutfitFilterModal';

type FilterContextType = {
  // Filtres pour les vêtements
  clothesFilter: string | null;
  setClothesFilter: (filter: string | null) => void;
  clothesAdvancedFilters: Filters;
  setClothesAdvancedFilters: (filters: Filters) => void;
  
  // Filtres pour les tenues
  outfitFilters: OutfitFilters;
  setOutfitFilters: (filters: OutfitFilters) => void;
  
  // État de visibilité des modales
  showClothesFilterModal: boolean;
  setShowClothesFilterModal: (show: boolean) => void;
  showOutfitFilterModal: boolean;
  setShowOutfitFilterModal: (show: boolean) => void;
  
  // Fonctions utilitaires
  resetClothesFilters: () => void;
  resetOutfitFilters: () => void;
  getClothesFilterCount: () => number;
  getOutfitFilterCount: () => number;
  
  // Recherche commune
  searchText: string;
  setSearchText: (text: string) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  // État des filtres pour les vêtements
  const [clothesFilter, setClothesFilter] = useState<string | null>(null);
  const [clothesAdvancedFilters, setClothesAdvancedFilters] = useState<Filters>({ 
    brands: [], 
    colors: [], 
    patterns: [], 
    materials: [],
    colorFilterMode: 'differentItems'
  });
  
  // État des filtres pour les tenues
  const [outfitFilters, setOutfitFilters] = useState<OutfitFilters>({ 
    seasons: [], 
    occasions: [],
    genders: [],
    withFavorites: false 
  });
  
  // État de visibilité des modales
  const [showClothesFilterModal, setShowClothesFilterModal] = useState(false);
  const [showOutfitFilterModal, setShowOutfitFilterModal] = useState(false);
  
  // Recherche commune
  const [searchText, setSearchText] = useState('');
  
  // Fonctions utilitaires
  const resetClothesFilters = () => {
    setClothesFilter(null);
    setClothesAdvancedFilters({ 
      brands: [], 
      colors: [], 
      patterns: [], 
      materials: [], 
      colorFilterMode: 'differentItems' 
    });
  };
  
  const resetOutfitFilters = () => {
    setOutfitFilters({ seasons: [], occasions: [], genders: [], withFavorites: false });
  };
  
  const getClothesFilterCount = () => {
    return clothesAdvancedFilters.brands.length + clothesAdvancedFilters.colors.length + 
           (clothesAdvancedFilters.patterns ? clothesAdvancedFilters.patterns.length : 0);
  };
  
  const getOutfitFilterCount = () => {
    return outfitFilters.seasons.length + outfitFilters.occasions.length + 
           outfitFilters.genders.length + (outfitFilters.withFavorites ? 1 : 0);
  };
  
  return (
    <FilterContext.Provider value={{
      clothesFilter,
      setClothesFilter,
      clothesAdvancedFilters,
      setClothesAdvancedFilters,
      outfitFilters,
      setOutfitFilters,
      showClothesFilterModal,
      setShowClothesFilterModal,
      showOutfitFilterModal,
      setShowOutfitFilterModal,
      resetClothesFilters,
      resetOutfitFilters,
      getClothesFilterCount,
      getOutfitFilterCount,
      searchText,
      setSearchText
    }}>
      {children}
    </FilterContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de filtrage
export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}; 