import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { occasions, seasons, genders } from '@/constants/Outfits';
import GenericSelector from './GenericSelector';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useFilter } from '@/contexts/FilterContext';

export type OutfitFilters = {
  seasons: string[];
  occasions: string[];
  genders: string[];
  withFavorites: boolean;
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
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { resetFilters: resetFiltersContext } = useFilter();
  // État local pour les filtres
  const [seasonsFilter, setSeasonsFilter] = useState<string[]>(currentFilters.seasons);
  const [occasionsFilter, setOccasionsFilter] = useState<string[]>(currentFilters.occasions);
  const [gendersFilter, setGendersFilter] = useState<string[]>(currentFilters.genders || []);
  const [withFavoritesFilter, setwithFavoritesFilter] = useState<boolean>(currentFilters.withFavorites);

  useEffect(() => {
    if (visible) {
      // Réinitialiser les états locaux avec les filtres actuels
      setSeasonsFilter(currentFilters.seasons);
      setOccasionsFilter(currentFilters.occasions);
      setGendersFilter(currentFilters.genders || []);
      setwithFavoritesFilter(currentFilters.withFavorites);
    }
  }, [visible, currentFilters]);
  
  const handleApply = () => {
    onApplyFilters({
      seasons: seasonsFilter,
      occasions: occasionsFilter,
      genders: gendersFilter,
      withFavorites: withFavoritesFilter
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
    setwithFavoritesFilter(false);
  };
  
  if (!visible) return null;
  
  return (
    <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background.main }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text.main }]}>Filtrer les tenues</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.main} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Saisons</Text>
          <View style={styles.optionsContainer}>
            {Object.keys(seasons).map(season => (
              <TouchableOpacity 
                key={season}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.gray },
                  seasonsFilter.includes(season) && [styles.optionButtonActive, { backgroundColor: colors.primary.main }]
                ]}
                onPress={() => toggleSeason(season)}
              >
                <Text style={[
                  styles.optionText,
                  { color: colors.text.light },
                  seasonsFilter.includes(season) && [styles.optionTextActive, { color: colors.text.bright }]
                ]}>
                  {seasons[season]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Occasions</Text>
          <GenericSelector
            options={occasions}
            selectedOption={occasionsFilter}
            onOptionSelect={(option) => setOccasionsFilter(Array.isArray(option) ? option : [option])}
            title="Occasions"
            multiSelect
            searchable
          />
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.main }]}>Genre</Text>
          <View style={styles.optionsContainer}>
            {Object.keys(genders).map(gender => (
              <TouchableOpacity 
                key={gender}
                style={[
                  styles.optionButton,
                  { backgroundColor: colors.gray },
                  gendersFilter.includes(gender) && [styles.optionButtonActive, { backgroundColor: colors.primary.main }]
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
                    color={gendersFilter.includes(gender) ? colors.text.bright : colors.text.light} 
                    style={styles.genderIcon}
                  />
                  <Text style={[
                    styles.optionText,
                    { color: colors.text.light },
                    gendersFilter.includes(gender) && [styles.optionTextActive, { color: colors.text.bright }]
                  ]}>
                    {genders[gender]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: colors.secondary.main }]}
            onPress={resetFilters}
          >
            <Text style={[styles.resetButtonText, { color: colors.white }]}>Réinitialiser</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: colors.primary.main }]}
            onPress={handleApply}
          >
            <Text style={[styles.applyButtonText, { color: colors.white }]}>Appliquer</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
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
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
  },
  optionText: {
    fontSize: 14,
  },
  optionTextActive: {
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
  },
  resetButtonText: {
    fontSize: 16,
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OutfitFilterModal; 