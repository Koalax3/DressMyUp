import { ClothingItem, Outfit } from '@/types';

export const colorMatch = (item: ClothingItem, currentItem: ClothingItem): boolean => {
  const itemColors = item.color.split(',').map(c => c.trim());
  const currentColors = currentItem.color.split(',').map(c => c.trim());

  for (const color of itemColors) {
    if (!currentColors.includes(color)) {
      return false;
    }
  }
  return itemColors.length === currentColors.length;
}

export const isDressMatch = (item: ClothingItem, currentItem: ClothingItem): boolean => {
  return !!(colorMatch(item, currentItem) &&
    item.reference && item.reference === currentItem.reference &&
    item.subtype === currentItem.subtype);
}

export const isPerfectMatch = (item: ClothingItem, currentItem: ClothingItem): boolean => {
  return !!(colorMatch(item, currentItem) &&
    item.subtype === currentItem.subtype &&
    (item.material === currentItem.material) &&
    (item.pattern === currentItem.pattern) &&
    (item.brand === currentItem.brand));
}

export const isSimilarMatch = (item: ClothingItem, currentItem: ClothingItem): boolean => {
  return colorMatch(item, currentItem) &&
    item.subtype === currentItem.subtype &&
    ((item.material === currentItem.material) ||
    (item.pattern === currentItem.pattern));
}
export const calculateMatchingPercentage = (
  outfit: Outfit,
  userWardrobe: ClothingItem[]
): number => {
  if (!outfit?.clothes || outfit.clothes.length === 0 || !userWardrobe || userWardrobe.length === 0) {
    return 0;
  }

  const totalItems = outfit.clothes.length;
  let totalPercentage = 0;
  const dressMatches = [];
  const perfectMatches = [];
  const similarMatches = [];

  outfit.clothes.forEach(item => {
    if (!item) return;

    const matchingItem = item.clothe || item;
    userWardrobe.forEach(wardrobeItem => {
      if (!wardrobeItem) return false;
      if (isDressMatch(matchingItem, wardrobeItem)) {
        dressMatches.push(wardrobeItem);
      } else if (isPerfectMatch(matchingItem, wardrobeItem)) {
        perfectMatches.push(wardrobeItem);
      } else if (isSimilarMatch(matchingItem, wardrobeItem)) {
        similarMatches.push(wardrobeItem);
      }
    });
  });
  totalPercentage += dressMatches.length * 100;
  totalPercentage += perfectMatches.length * 80;
  totalPercentage += similarMatches.length * 50;

  return Math.round(totalPercentage / totalItems);
}; 