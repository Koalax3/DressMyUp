// Export de tous les services pour un accès plus facile
import * as AuthService from './authService';
import * as ClothingService from './clothingService';
import * as OutfitService from './outfitService';
import * as UserService from './userService';
import * as StorageService from './storageService';
import * as ClotheOutfitsService from './clotheOutfitsService';
import * as PreferencesService from './preferencesService';

// Exporter chaque service sous son propre espace de noms
export {
  AuthService,
  ClothingService,
  OutfitService,
  UserService,
  StorageService,
  ClotheOutfitsService,
  PreferencesService,
};