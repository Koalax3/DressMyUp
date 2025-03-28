import { ClothingItem, Outfit } from '@/types';
import { MatchType } from '@/components/ClotheView';

export const calculateMatchingPercentage = (
  outfit: Outfit,
  userWardrobe: ClothingItem[]
): number => {
  if (!outfit?.clothes || outfit.clothes.length === 0 || !userWardrobe || userWardrobe.length === 0) {
    return 0;
  }

  const totalItems = outfit.clothes.length;
  let totalPercentage = 0;

  outfit.clothes.forEach(item => {
    if (!item) return;

    const matchingItem = item.clothe || item;
    const matchingItems = userWardrobe.filter(wardrobeItem => {
      if (!wardrobeItem) return false;

      // Vérifier les correspondances parfaites
      const perfectMatch = 
        wardrobeItem.color === matchingItem.color &&
        wardrobeItem.subtype === matchingItem.subtype &&
        (wardrobeItem.material === matchingItem.material || !matchingItem.material) &&
        (wardrobeItem.pattern === matchingItem.pattern || !matchingItem.pattern) &&
        (wardrobeItem.brand === matchingItem.brand || !matchingItem.brand);

      // Vérifier les correspondances similaires
      const similarMatch = 
        wardrobeItem.color === matchingItem.color &&
        wardrobeItem.subtype === matchingItem.subtype &&
        (wardrobeItem.material === matchingItem.material || !matchingItem.material);

      return perfectMatch || similarMatch;
    });

    if (matchingItems.length > 0) {
      // Si c'est une correspondance parfaite, ajouter 100%
      // Si c'est une correspondance similaire, ajouter 50%
      const isPerfectMatch = matchingItems.some(match => 
        match.color === matchingItem.color &&
        match.subtype === matchingItem.subtype &&
        (match.material === matchingItem.material || !matchingItem.material) &&
        (match.pattern === matchingItem.pattern || !matchingItem.pattern) &&
        (match.brand === matchingItem.brand || !matchingItem.brand)
      );

      totalPercentage += isPerfectMatch ? 100 : 50;
    }
  });

  return Math.round(totalPercentage / totalItems);
}; 