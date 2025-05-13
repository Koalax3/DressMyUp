import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';
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
  const { t } = useTranslation();
  const seasons: { value: Season; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'all', icon: 'calendar-outline' },
    { value: 'spring', icon: 'flower-outline' },
    { value: 'summer', icon: 'sunny-outline' },
    { value: 'fall', icon: 'leaf-outline' },
    { value: 'winter', icon: 'snow-outline' }
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
            {t(`seasons.${season.value}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  seasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    columnGap: 10,
    rowGap: 8
  },
  seasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
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