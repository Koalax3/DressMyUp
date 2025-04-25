/**
 * Hook pour accéder aux couleurs du thème avec support du mode sombre
 */

import { ColorsTheme, DarkColorsTheme } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

type ColorThemeType = typeof ColorsTheme;

// Type d'une catégorie de couleur (comme 'primary', 'background', etc.)
type ColorCategory = keyof ColorThemeType;

// Type d'une variante de couleur pour une catégorie donnée (comme 'light', 'main', etc.)
type ColorVariant<T extends ColorCategory> = keyof ColorThemeType[T];

// Hook pour obtenir une couleur du thème basée sur la catégorie et la variante
export function useThemeColor<T extends ColorCategory>(
  category: T,
  variant: ColorVariant<T>
): string {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? DarkColorsTheme : ColorsTheme;
  
  // @ts-ignore - Nécessaire car TypeScript a du mal avec ce type de propriété dynamique
  return themeColors[category][variant as string];
}

// Hook pour obtenir une couleur brute du thème (comme 'white', 'gray')
export function useRawThemeColor(colorName: 'white' | 'gray'): string {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? DarkColorsTheme : ColorsTheme;
  
  return themeColors[colorName];
}
