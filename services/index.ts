// Export de tous les services pour un accès plus facile
import * as AuthService from './authService';
import * as ClothingService from './clothingService';
import * as OutfitService from './outfitService';
import * as UserService from './userService';
import * as StorageService from './storageService';

// Exporter chaque service sous son propre espace de noms
export {
  AuthService,
  ClothingService,
  OutfitService,
  UserService,
  StorageService,
};

// Re-export des types pour une meilleure expérience d'importation
export type {
  AuthError,
  AuthSuccess,
  AuthResponse,
} from './authService';

export type {
  OutfitWithUser,
  OutfitWithDetails,
} from './outfitService';

export type {
  StorageBucket,
} from './storageService'; 