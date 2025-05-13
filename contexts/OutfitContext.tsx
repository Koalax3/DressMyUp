import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ClothingItem, ClothingWithPosition, Outfit } from '@/types';
import { useAuth } from './AuthContext';
import * as OutfitService from '@/services/outfitService';

interface OutfitContextType {
    clothescreateOutfit: ClothingWithPosition[];
    setClothescreateOutfit: (clothescreateOutfit: ClothingWithPosition[]) => void;
    clothesExploreOutfit: ClothingItem[];
    setClothesExploreOutfit: (clothesExploreOutfit: ClothingItem[]) => void;
    outfits: Outfit[];
    isLoading: boolean;
    refreshOutfits: () => Promise<void>;
    hasOutfits: boolean;
    hasClothesExplore: boolean;
}

const OutfitContext = createContext<OutfitContextType | undefined>(undefined);

export const OutfitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [clothescreateOutfit, setClothescreateOutfit] = useState<ClothingWithPosition[]>([]);
    const [clothesExploreOutfit, setClothesExploreOutfit] = useState<ClothingItem[]>([]);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const hasClothesExplore = useMemo(() => {
        return clothesExploreOutfit.length > 0;
    }, [clothesExploreOutfit]);

    const fetchOutfits = async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            const outfitsData = await OutfitService.fetchUserOutfits(user.id);
            setOutfits(outfitsData);
        } catch (error) {
            console.error('Erreur lors de la récupération des tenues:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOutfits();
        }
    }, [user]);

    const refreshOutfits = async () => {
        await fetchOutfits();
    };

    const hasOutfits = outfits.length > 0;

    return (
        <OutfitContext.Provider value={{ 
            clothescreateOutfit, 
            setClothescreateOutfit,
            clothesExploreOutfit,
            setClothesExploreOutfit,
            outfits,
            isLoading,
            refreshOutfits,
            hasOutfits,
            hasClothesExplore
        }}>
            {children}
        </OutfitContext.Provider>
    );
};

export const useOutfit = () => {
    const context = useContext(OutfitContext);
    if (context === undefined) {
        throw new Error('useOutfit doit être utilisé à l\'intérieur d\'un OutfitProvider');
    }
    return context;
}; 