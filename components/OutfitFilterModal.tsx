import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { occasions, seasons, genders } from '@/constants/Outfits';

export type OutfitFilters = {
  seasons: string[];
  occasions: string[];
  genders: string[];
  onlyFavorites: boolean;
};

type OutfitFilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: OutfitFilters) => void;
  currentFilters: OutfitFilters;
};

const OutfitFilterModal = ({ 
  visible, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}: OutfitFilterModalProps) => {
  // État local pour les filtres
  const [seasonsFilter, setSeasonsFilter] = useState<string[]>(currentFilters.seasons);
  const [occasionsFilter, setOccasionsFilter] = useState<string[]>(currentFilters.occasions);
  const [gendersFilter, setGendersFilter] = useState<string[]>(currentFilters.genders || []);
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState<boolean>(currentFilters.onlyFavorites);
  
  useEffect(() => {
    if (visible) {
      // Réinitialiser les états locaux avec les filtres actuels
      setSeasonsFilter(currentFilters.seasons);
      setOccasionsFilter(currentFilters.occasions);
      setGendersFilter(currentFilters.genders || []);
      setOnlyFavoritesFilter(currentFilters.onlyFavorites);
    }
  }, [visible, currentFilters]);
  
  const handleApply = () => {
    onApplyFilters({
      seasons: seasonsFilter,
      occasions: occasionsFilter,
      genders: gendersFilter,
      onlyFavorites: onlyFavoritesFilter
    });
    onClose();
  };
  
  const toggleSeason = (season: string) => {
    setSeasonsFilter(prev => 
      prev.includes(season) 
        ? prev.filter(s => s !== season) 
        : [...prev, season]
    );
  };
  
  const toggleOccasion = (occasion: string) => {
    setOccasionsFilter(prev => 
      prev.includes(occasion) 
        ? prev.filter(o => o !== occasion) 
        : [...prev, occasion]
    );
  };
  
  const toggleGender = (gender: string) => {
    setGendersFilter(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender) 
        : [...prev, gender]
    );
  };
  
  const resetFilters = () => {
    setSeasonsFilter([]);
    setOccasionsFilter([]);
    setGendersFilter([]);
    setOnlyFavoritesFilter(false);
  };
  
  if (!visible) return null;
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtrer les tenues</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saisons</Text>
          <View style={styles.optionsContainer}>
            {Object.keys(seasons).map(season => (
              <TouchableOpacity 
                key={season}
                style={[
                  styles.optionButton,
                  seasonsFilter.includes(season) && styles.optionButtonActive
                ]}
                onPress={() => toggleSeason(season)}
              >
                <Text style={[
                  styles.optionText,
                  seasonsFilter.includes(season) && styles.optionTextActive
                ]}>
                  {seasons[season]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occasions</Text>
          <View style={styles.optionsContainer}>
            {Object.keys(occasions).map(occasion => (
              <TouchableOpacity 
                key={occasion}
                style={[
                  styles.optionButton,
                  occasionsFilter.includes(occasion) && styles.optionButtonActive
                ]}
                onPress={() => toggleOccasion(occasion)}
              >
                <Text style={[
                  styles.optionText,
                  occasionsFilter.includes(occasion) && styles.optionTextActive
                ]}>
                  {occasions[occasion]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genre</Text>
          <View style={styles.optionsContainer}>
            {Object.keys(genders).map(gender => (
              <TouchableOpacity 
                key={gender}
                style={[
                  styles.optionButton,
                  gendersFilter.includes(gender) && styles.optionButtonActive
                ]}
                onPress={() => toggleGender(gender)}
              >
                <View style={styles.genderOption}>
                  <Ionicons 
                    name={
                      gender === 'male' ? 'male-outline' :
                      gender === 'female' ? 'female-outline' :
                      'people-outline'
                    } 
                    size={16} 
                    color={gendersFilter.includes(gender) ? '#fff' : '#666'} 
                    style={styles.genderIcon}
                  />
                  <Text style={[
                    styles.optionText,
                    gendersFilter.includes(gender) && styles.optionTextActive
                  ]}>
                    {genders[gender]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.favoritesButton}
            onPress={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
          >
            <Ionicons 
              name={onlyFavoritesFilter ? "heart" : "heart-outline"} 
              size={24} 
              color={onlyFavoritesFilter ? "#F97A5C" : "#666"} 
            />
            <Text style={styles.favoritesText}>Afficher mes favoris</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#F97A5C',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderIcon: {
    marginRight: 5,
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  favoritesText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F97A5C',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OutfitFilterModal; 