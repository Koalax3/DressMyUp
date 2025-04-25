export type ClothingSize = {
  id: string;
  label: string;
  category: SizeCategory;
};

export type SizeCategory = 'tops' | 'bottoms' | 'footwear' | 'accessories' | 'outerwear';

// Tailles standard pour les hauts (t-shirts, chemises, etc.)
export const TOP_SIZES: ClothingSize[] = [
  { id: 'xs_tops', label: 'XS', category: 'tops' },
  { id: 's_tops', label: 'S', category: 'tops' },
  { id: 'm_tops', label: 'M', category: 'tops' },
  { id: 'l_tops', label: 'L', category: 'tops' },
  { id: 'xl_tops', label: 'XL', category: 'tops' },
  { id: 'xxl_tops', label: 'XXL', category: 'tops' },
];

// Tailles numériques pour les hauts (36, 38, etc.)
export const TOP_SIZES_NUMERIC: ClothingSize[] = [
  { id: '36_tops', label: '36', category: 'tops' },
  { id: '38_tops', label: '38', category: 'tops' },
  { id: '40_tops', label: '40', category: 'tops' },
  { id: '42_tops', label: '42', category: 'tops' },
  { id: '44_tops', label: '44', category: 'tops' },
  { id: '46_tops', label: '46', category: 'tops' },
];

// Tailles standard pour les bas (pantalons, shorts, etc.)
export const BOTTOM_SIZES: ClothingSize[] = [
  { id: 'xs_bottoms', label: 'XS', category: 'bottoms' },
  { id: 's_bottoms', label: 'S', category: 'bottoms' },
  { id: 'm_bottoms', label: 'M', category: 'bottoms' },
  { id: 'l_bottoms', label: 'L', category: 'bottoms' },
  { id: 'xl_bottoms', label: 'XL', category: 'bottoms' },
  { id: 'xxl_bottoms', label: 'XXL', category: 'bottoms' },
];

// Tailles numériques européennes pour les pantalons
export const BOTTOM_SIZES_EU: ClothingSize[] = [
  { id: '36_bottoms', label: '36', category: 'bottoms' },
  { id: '38_bottoms', label: '38', category: 'bottoms' },
  { id: '40_bottoms', label: '40', category: 'bottoms' },
  { id: '42_bottoms', label: '42', category: 'bottoms' },
  { id: '44_bottoms', label: '44', category: 'bottoms' },
  { id: '46_bottoms', label: '46', category: 'bottoms' },
  { id: '48_bottoms', label: '48', category: 'bottoms' },
];

// Tailles US/UK pour les pantalons
export const BOTTOM_SIZES_US: ClothingSize[] = [
  { id: '28_bottoms', label: '28', category: 'bottoms' },
  { id: '30_bottoms', label: '30', category: 'bottoms' },
  { id: '32_bottoms', label: '32', category: 'bottoms' },
  { id: '34_bottoms', label: '34', category: 'bottoms' },
  { id: '36_bottoms', label: '36', category: 'bottoms' },
  { id: '38_bottoms', label: '38', category: 'bottoms' },
];

// Tailles pour les chaussures (EU)
export const FOOTWEAR_SIZES_EU: ClothingSize[] = [
  { id: '36_footwear', label: '36', category: 'footwear' },
  { id: '37_footwear', label: '37', category: 'footwear' },
  { id: '38_footwear', label: '38', category: 'footwear' },
  { id: '39_footwear', label: '39', category: 'footwear' },
  { id: '40_footwear', label: '40', category: 'footwear' },
  { id: '41_footwear', label: '41', category: 'footwear' },
  { id: '42_footwear', label: '42', category: 'footwear' },
  { id: '43_footwear', label: '43', category: 'footwear' },
  { id: '44_footwear', label: '44', category: 'footwear' },
  { id: '45_footwear', label: '45', category: 'footwear' },
  { id: '46_footwear', label: '46', category: 'footwear' },
];

// Tailles pour les chaussures (US)
export const FOOTWEAR_SIZES_US: ClothingSize[] = [
  { id: '5_footwear_us', label: '5', category: 'footwear' },
  { id: '5.5_footwear_us', label: '5.5', category: 'footwear' },
  { id: '6_footwear_us', label: '6', category: 'footwear' },
  { id: '6.5_footwear_us', label: '6.5', category: 'footwear' },
  { id: '7_footwear_us', label: '7', category: 'footwear' },
  { id: '7.5_footwear_us', label: '7.5', category: 'footwear' },
  { id: '8_footwear_us', label: '8', category: 'footwear' },
  { id: '8.5_footwear_us', label: '8.5', category: 'footwear' },
  { id: '9_footwear_us', label: '9', category: 'footwear' },
  { id: '9.5_footwear_us', label: '9.5', category: 'footwear' },
  { id: '10_footwear_us', label: '10', category: 'footwear' },
  { id: '10.5_footwear_us', label: '10.5', category: 'footwear' },
  { id: '11_footwear_us', label: '11', category: 'footwear' },
  { id: '11.5_footwear_us', label: '11.5', category: 'footwear' },
  { id: '12_footwear_us', label: '12', category: 'footwear' },
];

// Tailles pour accessoires
export const ACCESSORY_SIZES: ClothingSize[] = [
  { id: 'onesize_accessories', label: 'Taille unique', category: 'accessories' },
  { id: 'xs_accessories', label: 'XS', category: 'accessories' },
  { id: 's_accessories', label: 'S', category: 'accessories' },
  { id: 'm_accessories', label: 'M', category: 'accessories' },
  { id: 'l_accessories', label: 'L', category: 'accessories' },
  { id: 'xl_accessories', label: 'XL', category: 'accessories' },
];

// Tailles pour les vêtements d'extérieur (manteaux, vestes, etc.)
export const OUTERWEAR_SIZES: ClothingSize[] = [
  { id: 'xs_outerwear', label: 'XS', category: 'outerwear' },
  { id: 's_outerwear', label: 'S', category: 'outerwear' },
  { id: 'm_outerwear', label: 'M', category: 'outerwear' },
  { id: 'l_outerwear', label: 'L', category: 'outerwear' },
  { id: 'xl_outerwear', label: 'XL', category: 'outerwear' },
  { id: 'xxl_outerwear', label: 'XXL', category: 'outerwear' },
];

// Toutes les tailles regroupées
export const ALL_SIZES: ClothingSize[] = [
  ...TOP_SIZES,
  ...TOP_SIZES_NUMERIC,
  ...BOTTOM_SIZES,
  ...BOTTOM_SIZES_EU,
  ...BOTTOM_SIZES_US,
  ...FOOTWEAR_SIZES_EU,
  ...FOOTWEAR_SIZES_US,
  ...ACCESSORY_SIZES,
  ...OUTERWEAR_SIZES,
];

// Fonction helper pour obtenir les tailles par catégorie
export const getSizesByCategory = (category: SizeCategory): ClothingSize[] => {
  switch (category) {
    case 'tops':
      return [...TOP_SIZES, ...TOP_SIZES_NUMERIC];
    case 'bottoms':
      return [...BOTTOM_SIZES, ...BOTTOM_SIZES_EU, ...BOTTOM_SIZES_US];
    case 'footwear':
      return [...FOOTWEAR_SIZES_EU, ...FOOTWEAR_SIZES_US];
    case 'accessories':
      return ACCESSORY_SIZES;
    case 'outerwear':
      return OUTERWEAR_SIZES;
    default:
      return ALL_SIZES;
  }
}; 