import { supabase } from '../constants/Supabase';
import { decode } from 'base64-arraybuffer';

// Types de stockage disponibles
export type StorageBucket = 'clothes' | 'profiles' | 'outfits' | 'avatars';

// Télécharger un fichier (image)
export const uploadFile = async (
  bucket: StorageBucket,
  filePath: string,
  fileContent: string,
  contentType: string = 'image/jpeg'
) => {
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, decode(fileContent), {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erreur lors du téléchargement du fichier: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Erreur lors du téléchargement du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Supprimer un fichier
export const deleteFile = async (
  bucket: StorageBucket,
  filePath: string
) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Erreur lors de la suppression du fichier: ${error.message}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Extraire le chemin du fichier à partir d'une URL
export const extractFilePathFromUrl = (url: string): string | null => {
  try {
    // Format attendu: https://xxxxxxxxxxxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
    const parts = url.split('/storage/v1/object/public/');
    if (parts.length !== 2) return null;
    
    const pathParts = parts[1].split('/');
    if (pathParts.length < 2) return null;
    
    // On retire le nom du bucket
    pathParts.shift();
    
    return pathParts.join('/');
  } catch (error) {
    console.error('Erreur lors de l\'extraction du chemin du fichier:', error);
    return null;
  }
};

// Télécharger une image d'un vêtement
export const uploadClothingImage = async (userId: string, base64Image: string) => {
  const fileName = `${userId}/${Date.now()}.jpg`;
  return await uploadFile('clothes', fileName, base64Image);
};

// Télécharger un avatar
export const uploadProfileAvatar = async (userId: string, base64Image: string) => {
  const fileName = `avatars/${userId}/${Date.now()}.jpg`;
  return await uploadFile('profiles', fileName, base64Image);
};

// Télécharger une image d'une tenue
export const uploadOutfitImage = async (userId: string, base64Data: string): Promise<string | null> => {
  try {
    // Vérifier les données
    if (!base64Data) {
      console.error('Données base64 invalides');
      return null;
    }

    // Préparer le chemin de fichier
    const fileName = `${userId}/${Date.now()}.jpg`;
    const contentType = 'image/jpeg';
    
    // Si les données contiennent déjà le préfixe 'data:image/...' l'enlever
    let processedData = base64Data;
    if (base64Data.includes('base64,')) {
      processedData = base64Data.split('base64,')[1];
    }
    
    // Télécharger vers Supabase
    const { error } = await supabase.storage
      .from('outfits')
      .upload(fileName, decode(processedData), {
        contentType,
        upsert: true,
      });
    
    if (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
      return null;
    }
    
    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('outfits')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    return null;
  }
}; 