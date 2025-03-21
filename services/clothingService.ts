import { supabase } from '../constants/Supabase';
import { ClothingItem, ClothingSubType, ClothingType } from '../types';
import { decode } from 'base64-arraybuffer';

// Type pour la création de vêtement
export type CreateClothingData = {
  name: string;
  type: ClothingType;
  subtype?: ClothingSubType;
  brand?: string;
  color: string;
  fit?: 'slim' | 'regular' | 'loose' | 'oversize';
  image_url: string;
};
const TABLE_NAME = 'clothes';
// Création d'un vêtement
export const createClothing = async (userId: string, clothingData: CreateClothingData): Promise<ClothingItem | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          user_id: userId,
          name: clothingData.name,
          type: clothingData.type,
          subtype: clothingData.subtype,
          brand: clothingData.brand,
          color: clothingData.color,
          fit: clothingData.fit,
          image_url: clothingData.image_url,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du vêtement: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
};

// Récupération de tous les vêtements d'un utilisateur
export const fetchUserClothes = async (userId: string): Promise<ClothingItem[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des vêtements: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
};

/**
 * Récupère un vêtement par son ID
 */
export const getClothingById = async (id: string, userId: string): Promise<ClothingItem | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la récupération du vêtement: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur:', error);
    return null;
  }
};

/**
 * Supprime un vêtement et son image associée
 */
export const deleteClothing = async (id: string, userId: string): Promise<boolean> => {
  try {
    // Récupérer d'abord le vêtement pour obtenir l'URL de l'image
    const clothing = await getClothingById(id, userId);
    
    if (!clothing) {
      throw new Error("Vêtement introuvable ou vous n'êtes pas autorisé à le supprimer");
    }
    
    // Supprimer d'abord les relations dans clothes_outfits
    const { error: relationsError } = await supabase
      .from('clothes_outfits')
      .delete()
      .eq('clothe_id', id);
    
    if (relationsError) {
      console.error('Erreur lors de la suppression des relations:', relationsError);
      // Continue même si les relations n'ont pas pu être supprimées
    }
    
    // Supprimer le vêtement
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Erreur lors de la suppression du vêtement: ${error.message}`);
    }
    
    // Supprimer l'image du stockage
    if (clothing.image_url) {
      try {
        const imageName = clothing.image_url.split('/').pop();
        if (imageName) {
          const path = `${userId}/${imageName}`;
          await supabase.storage.from('clothes').remove([path]);
        }
      } catch (imageError) {
        console.error('Erreur lors de la suppression de l\'image:', imageError);
        // Continue même si l'image n'a pas pu être supprimée
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Met à jour un vêtement existant
 */
export const updateClothing = async (id: string, userId: string, clothingData: Partial<CreateClothingData>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        name: clothingData.name,
        type: clothingData.type,
        subtype: clothingData.subtype,
        brand: clothingData.brand,
        color: clothingData.color,
        fit: clothingData.fit,
        image_url: clothingData.image_url,
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du vêtement: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Télécharge une image et retourne son URL publique
 */
export const uploadClothingImage = async (userId: string, imageUri: string): Promise<string | null> => {
  try {
    // Si l'URI commence par "data:", c'est déjà un base64
    if (imageUri.startsWith('data:')) {
      const base64Data = imageUri.split(",")[1];
      if (!base64Data) {
        throw new Error("Format d'image invalide");
      }
      
      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('clothes')
        .upload(fileName, decode(base64Data), {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      const { data } = supabase.storage
        .from('clothes')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } 
    // Sinon, c'est une URI de fichier, il faut d'abord la convertir
    else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result?.toString().split(',')[1];
            
            if (!base64Data) {
              reject(new Error('Erreur lors de la conversion en base64'));
              return;
            }
            
            const fileName = `${userId}/${Date.now()}.jpg`;
            const { error } = await supabase.storage
              .from('clothes')
              .upload(fileName, decode(base64Data), {
                contentType: 'image/jpeg',
                upsert: true
              });
            
            if (error) {
              reject(error);
              return;
            }
            
            const { data } = supabase.storage
              .from('clothes')
              .getPublicUrl(fileName);
            
            resolve(data.publicUrl);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    return null;
  }
};

// Récupération des vêtements filtrés par type
export const fetchClothesByType = async (userId: string, type: ClothingItem['type']) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des vêtements: ${error.message}`);
  }

  return data || [];
}; 