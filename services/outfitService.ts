import { supabase } from '../constants/Supabase';
import { Outfit, ClothingItem, User, Comment } from '../types';

// Types pour les retours de données
export type OutfitWithUser = Outfit & { 
  user: User;
  outfit_clothes: ClothingItem[];
};

export type OutfitWithDetails = Outfit & {
  user: User;
  clothes: ClothingItem[];
  comments: (Comment & { user: User })[];
};

export type CreateOutfitData = {
  name: string;
  description?: string;
  image_url?: string;
  season?: string;
  occasion?: string;
}
const TABLE_NAME = 'outfits';
// Création d'une tenue
export const createOutfit = async (
  userId: string,
  outfitData: CreateOutfitData
) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        user_id: userId,
        name: outfitData.name,
        description: outfitData.description || null,
        image_url: outfitData.image_url || null,
        season: outfitData.season || 'all',
        occasion: outfitData.occasion || 'casual',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création de la tenue:', error);
    return null;
  }

  return data;
};

// Association de vêtements à une tenue
export const associateClothesToOutfit = async (
  outfitId: string,
  clothingIds: string[]
) => {
  if (clothingIds.length === 0) return true;
  
  const clothesOutfitsData = clothingIds.map(clothingId => ({
    outfit_id: outfitId,
    clothe_id: clothingId,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('clothes_outfits')
    .insert(clothesOutfitsData);

  if (error) {
    console.error('Erreur lors de l\'association des vêtements:', error);
    return false;
  }

  return true;
};

// Récupération des tenues pour l'exploration
export const fetchOutfitsForExplore = async (userId: string, searchQuery?: string) => {
  let query = supabase
    .from(TABLE_NAME)
    .select(`
      *,
      user:user_id (*),
      outfit_clothes:clothes_outfits(*, clothing:clothe_id(*))
    `)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des tenues: ${error.message}`);
  }

  // Transformer les données
  return data ? data.map((outfit: any) => ({
    ...outfit,
    outfit_clothes: outfit.outfit_clothes.map((item: any) => item.clothing)
  })) : [];
};

// Récupération des tenues d'un utilisateur spécifique
export const fetchUserOutfits = async (userId: string) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des tenues: ${error.message}`);
  }

  return data || [];
};

// Récupération des détails d'une tenue spécifique
export const fetchOutfitDetails = async (outfitId: string): Promise<OutfitWithDetails> => {
  // Récupérer les détails de la tenue avec l'utilisateur
  const { data: outfitData, error: outfitError } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      user:user_id (*)
    `)
    .eq('id', outfitId)
    .single();

  if (outfitError) {
    throw new Error(`Erreur lors de la récupération de la tenue: ${outfitError.message}`);
  }

  // Récupérer les vêtements associés via clothes_outfits
  const { data: clothesData, error: clothesError } = await supabase
    .from('clothes_outfits')
    .select(`
      clothing:clothe_id (*)
    `)
    .eq('outfit_id', outfitId);

  if (clothesError) {
    throw new Error(`Erreur lors de la récupération des vêtements: ${clothesError.message}`);
  }

  // Récupérer les commentaires avec les utilisateurs
  const { data: commentsData, error: commentsError } = await supabase
    .from('comments')
    .select(`
      *,
      user:users!comments_user_id_fkey(*)
    `)
    .eq('outfit_id', outfitId)
    .order('created_at', { ascending: false });

  if (commentsError) {
    throw new Error(`Erreur lors de la récupération des commentaires: ${commentsError.message}`);
  }

  // Formater les données
  const clothes = clothesData ? clothesData.map(item => item.clothing) : [];
  
  return {
    ...outfitData,
    clothes,
    comments: commentsData || [],
  };
};

// Like / Unlike une tenue
export const toggleLikeOutfit = async (userId: string, outfitId: string) => {
  // Vérifier si l'utilisateur a déjà aimé cette tenue
  const { data: existingLike, error: checkError } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('outfit_id', outfitId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification du like: ${checkError.message}`);
  }

  if (existingLike) {
    // Supprimer le like
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (deleteError) {
      throw new Error(`Erreur lors de la suppression du like: ${deleteError.message}`);
    }

    // Décrémenter le compteur de likes
    await supabase.rpc('decrement_likes', { outfit_id: outfitId });
    
    return false; // Retourne false pour indiquer que le like a été supprimé
  } else {
    // Ajouter un like
    const { error: insertError } = await supabase
      .from('likes')
      .insert([
        {
          user_id: userId,
          outfit_id: outfitId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      throw new Error(`Erreur lors de l'ajout du like: ${insertError.message}`);
    }

    // Incrémenter le compteur de likes
    await supabase.rpc('increment_likes', { outfit_id: outfitId });
    
    return true; // Retourne true pour indiquer que le like a été ajouté
  }
};

// Vérifier si un utilisateur a aimé une tenue
export const checkIfLiked = async (userId: string, outfitId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', userId)
    .eq('outfit_id', outfitId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification du like: ${error.message}`);
  }

  return !!data;
};

// Ajouter un commentaire à une tenue
export const addCommentToOutfit = async (
  userId: string,
  outfitId: string,
  content: string
) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        user_id: userId,
        outfit_id: outfitId,
        content: content.trim(),
        created_at: new Date().toISOString(),
      },
    ])
    .select(`*, user:users!comments_user_id_fkey (*)`);

  if (error) {
    throw new Error(`Erreur lors de l'ajout du commentaire: ${error.message}`);
  }

  return data?.[0];
};

// Suppression d'une tenue
export const deleteOutfit = async (outfitId: string, userId: string) => {
  try {
    // Vérifier que la tenue appartient à l'utilisateur
    const { data: outfit, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', outfitId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Erreur lors de la vérification de la tenue: ${fetchError.message}`);
    }

    if (!outfit) {
      throw new Error("Vous n'êtes pas autorisé à supprimer cette tenue");
    }

    // Supprimer d'abord les relations dans clothes_outfits
    const { error: relationsError } = await supabase
      .from('clothes_outfits')
      .delete()
      .eq('outfit_id', outfitId);

    if (relationsError) {
      throw new Error(`Erreur lors de la suppression des relations: ${relationsError.message}`);
    }

    // Supprimer les commentaires
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('outfit_id', outfitId);

    if (commentsError) {
      throw new Error(`Erreur lors de la suppression des commentaires: ${commentsError.message}`);
    }

    // Supprimer les likes
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('outfit_id', outfitId);

    if (likesError) {
      throw new Error(`Erreur lors de la suppression des likes: ${likesError.message}`);
    }

    // Supprimer la tenue
    const log = await supabase
      .from('outfits')
      .delete()
      .eq('id', outfitId);
    console.log(log);
    if (log.error) {
      throw new Error(`Erreur lors de la suppression de la tenue: ${log.error.message}`);
    }

    // Si une image était associée à la tenue, la supprimer du stockage
    if (outfit.image_url) {
      const imagePath = outfit.image_url.split('/').slice(-2).join('/');
      
      if (imagePath) {
        const { error: storageError } = await supabase
          .storage
          .from('outfits')
          .remove([imagePath]);

        if (storageError) {
          console.error(`Erreur lors de la suppression de l'image: ${storageError.message}`);
          // On continue même si l'image n'a pas pu être supprimée
        }
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
}; 