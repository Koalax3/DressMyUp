import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';

type Season = 'all' | 'spring' | 'summer' | 'fall' | 'winter';

interface SeasonSelectorProps {
  selectedSeason: Season;
  onSelectSeason: (season: Season) => void;
}

const SeasonSelector: React.FC<SeasonSelectorProps> = ({ 
  selectedSeason, 
  onSelectSeason 
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const seasons: { value: Season; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'all', label: 'Toutes', icon: 'calendar-outline' },
    { value: 'spring', label: 'Printemps', icon: 'flower-outline' },
    { value: 'summer', label: 'Été', icon: 'sunny-outline' },
    { value: 'fall', label: 'Automne', icon: 'leaf-outline' },
    { value: 'winter', label: 'Hiver', icon: 'snow-outline' }
  ];

  return (
    <View style={styles.seasonContainer}>
      {seasons.map((season) => (
        <TouchableOpacity
          key={season.value}
          style={[
            styles.seasonButton,
            { backgroundColor: colors.gray },
            selectedSeason === season.value && [styles.seasonButtonActive, { backgroundColor: colors.primary.main }]
          ]}
          onPress={() => onSelectSeason(season.value)}
        >
          <Ionicons
            name={season.icon}
            size={18}
            color={selectedSeason === season.value ? ColorsTheme.white : colors.text.main}
          />
          <Text
            style={[
              styles.seasonButtonText,
              { color: colors.text.main },
              selectedSeason === season.value && [styles.seasonButtonTextActive]
            ]}
          >
            {season.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  seasonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  seasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  seasonButtonActive: {
    // Style for active button handled in component with backgroundColor
  },
  seasonButtonText: {
    fontSize: 14,
    marginLeft: 5,
  },
  seasonButtonTextActive: {
    fontWeight: 'bold',
    color: ColorsTheme.white,
  }
});

export default SeasonSelector; 