import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClothingItem } from '../types';
import * as ClothingService from '../services/clothingService';
import { useAuth } from './AuthContext';

interface ClothingContextProps {
  clothes: ClothingItem[];
  isLoading: boolean;
  error: string | null;
  refreshClothes: () => Promise<void>;
  addClothing: (clothingItem: ClothingItem) => void;
  updateClothing: (id: string, updatedClothing: Partial<ClothingItem>) => void;
  deleteClothing: (id: string) => void;
  getClothingById: (id: string) => ClothingItem | undefined;
  fetchClothingById: (id: string) => Promise<ClothingItem | null>;
  loadClothing: (id: string) => Promise<ClothingItem | null>;
  fetchUserPublicClothes: (userId: string) => Promise<ClothingItem[]>;
  refreshing: boolean;
  setRefreshing: (refreshing: boolean) => void;
  hasClothes: boolean;
  setHasClothes: (hasClothes: boolean) => void;
}

const ClothingContext = createContext<ClothingContextProps | undefined>(undefined);

export const useClothing = (): ClothingContextProps => {
  const context = useContext(ClothingContext);
  if (!context) {
    throw new Error('useClothing doit être utilisé à l\'intérieur d\'un ClothingProvider');
  }
  return context;
};

interface ClothingProviderProps {
  children: ReactNode;
}

export const ClothingProvider: React.FC<ClothingProviderProps> = ({ children }) => {
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user } = useAuth();
  const [hasClothes, setHasClothes] = useState<boolean>(false);
  const fetchClothes = async () => {
    if (!user) {
      setClothes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userClothes = await ClothingService.fetchUserClothes(user.id);
      setClothes(userClothes);
      setHasClothes(userClothes.length > 0);
    } catch (err) {
      setError('Erreur lors du chargement des vêtements');
      console.error('Erreur lors du chargement des vêtements:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(true);
    }
  };

  // Charger les vêtements au démarrage et quand l'utilisateur change
  useEffect(() => {
    fetchClothes();
  }, [user]);

  const refreshClothes = async () => {
    await fetchClothes();
  };

  const addClothing = (clothingItem: ClothingItem) => {
    setClothes(prevClothes => {
      // Vérifier si le vêtement existe déjà
      const exists = prevClothes.some(item => item.id === clothingItem.id);
      if (exists) {
        // Si oui, le mettre à jour
        return prevClothes.map(item => 
          item.id === clothingItem.id ? clothingItem : item
        );
      } else {
        // Sinon, l'ajouter
        return [clothingItem, ...prevClothes ];
      }
    });
    setRefreshing(true);
  };

  const updateClothing = (id: string, updatedClothing: Partial<ClothingItem>) => {
    setClothes(prevClothes => 
      prevClothes.map(clothing => 
        clothing.id === id ? { ...clothing, ...updatedClothing } : clothing
      )
    );
    setRefreshing(true);
  };

  const deleteClothing = (id: string) => {
    setClothes(prevClothes => prevClothes.filter(clothing => clothing.id !== id));
    setRefreshing(true);
  };

  // Version synchrone qui cherche seulement dans le cache
  const getClothingById = (id: string): ClothingItem | undefined => {
    return clothes.find(clothing => clothing.id === id);
  };

  // Version asynchrone qui va chercher dans l'API si nécessaire
  const fetchClothingById = async (id: string): Promise<ClothingItem | null> => {
    // Chercher d'abord dans le cache
    const cachedClothing = clothes.find(clothing => clothing.id === id);
    if (cachedClothing) {
      return cachedClothing;
    }

    // Sinon, faire un appel API
    try {
      const fetchedClothing = await ClothingService.getClothingById(id);
      if (fetchedClothing) {
        // Ajouter au cache
        addClothing(fetchedClothing);
        return fetchedClothing;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du vêtement:', error);
      return null;
    }
  };

  // Fonction pratique qui gère le chargement complet d'un vêtement
  const loadClothing = async (id: string): Promise<ClothingItem | null> => {
    try {
      // Essayer d'abord de récupérer depuis le cache
      const cachedItem = getClothingById(id);
      if (cachedItem) {
        return cachedItem;
      }
      
      // Si pas en cache, tenter de récupérer depuis l'API directement
      // C'est utile pour accéder aux vêtements d'autres utilisateurs
      const directlyFetchedItem = await ClothingService.getClothingById(id);
      if (directlyFetchedItem) {
        // Vérifier si c'est un vêtement appartenant à l'utilisateur connecté
        if (user && directlyFetchedItem.user_id === user.id) {
          // Si c'est le cas, l'ajouter au cache
          addClothing(directlyFetchedItem);
        }
        return directlyFetchedItem;
      }
      
      // Si toujours pas trouvé, rafraîchir la liste complète des vêtements de l'utilisateur
      // (Ceci ne devrait être nécessaire que pour les vêtements de l'utilisateur actuel)
      await fetchClothes();
      return getClothingById(id) || null;
    } catch (error) {
      console.error('Erreur lors du chargement du vêtement:', error);
      return null;
    } finally {
      setRefreshing(true);
    }
  };

  // Charger les vêtements d'un autre utilisateur
  const fetchUserPublicClothes = async (userId: string): Promise<ClothingItem[]> => {
    try {
      return await ClothingService.fetchPublicUserClothes(userId);
    } catch (error) {
      console.error('Erreur lors du chargement des vêtements publics:', error);
      return [];
    }
  };

  const value = {
    clothes,
    isLoading,
    error,
    refreshClothes,
    addClothing,
    updateClothing,
    deleteClothing,
    getClothingById,
    fetchClothingById,
    loadClothing,
    fetchUserPublicClothes,
    refreshing,
    setRefreshing,
    hasClothes,
    setHasClothes
  };

  return (
    <ClothingContext.Provider value={value}>
      {children}
    </ClothingContext.Provider>
  );
};

export default ClothingContext; 