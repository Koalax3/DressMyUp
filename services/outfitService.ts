import { supabase } from '../constants/Supabase';
import { Outfit, ClothingItem, User, Comment } from '../types';
import { associateClothesToOutfit, deleteAllClotheOutfitByOutfitId } from './clotheOutfitsService';
import { applyFilter, FilterConstraint } from './supabaseService';

// Types pour les retours de données
export type OutfitWithUser = Outfit & { 
  user: User;
  outfit_clothes: ClothingItem[];
  isPublic?: boolean;
  gender?: string | null;
};

export type OutfitWithDetails = Outfit & {
  user: User;
  clothes: ClothingItem[];
  comments: (Comment & { user: User })[];
  isPublic?: boolean;
  gender?: string | null;
  updated_at?: string;
};

export type CreateOutfitData = {
  name: string;
  description?: string;
  image_url?: string;
  season?: string;
  occasion?: string | null;
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

// Récupération des tenues pour l'exploration
export const fetchOutfitsForExplore = async (userId: string, page: number = 1, itemsPerPage: number = 10, options: FilterConstraint[] = []) => {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;

  let query = supabase
    .from(TABLE_NAME)
    .select(`
      *,
      user:user_id (*),
      likes:likes(
        id,
        user_id
      ),
      clothes:clothes_outfits(
        id,
        clothe_id,
        clothe:clothe_id(*)
      )
    `)
    .eq('isPublic', true)
    .neq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(start, end);
  if (options.length > 0) {
    for (const [operator, field, value] of options) {
      query = applyFilter(query, operator, field, value);
    }
  }

  return await query;
};

export const fetchOutfitsForWardrobe = async (userId: string, searchQuery?: string) => {
  try {

    // Construire la requête pour récupérer les tenues que l'on possède
    let query = supabase
      .from(TABLE_NAME)
      .select(`
        *,
        user:user_id (*),
        likes:likes(
          id,
          user_id
        ),
        clothes:clothes_outfits(
          id,
          clothe_id,
          clothe:clothe_id(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Ajouter une recherche textuelle si un terme de recherche est fourni
    if (searchQuery && searchQuery.trim() !== '') {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Exécuter la requête
    return await query;
  } catch (error) {
    console.error('Erreur dans fetchOutfitsForWardrobe:', error);
    throw error;
  }
};

// Récupération des tenues d'un utilisateur spécifique
export const fetchUserOutfits = async (userId: string) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      user:user_id (*),
      likes:likes(
        id,
        user_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des tenues: ${error.message}`);
  }

  return data || [];
};

// Récupération des détails d'une tenue spécifique
export const fetchOutfitDetails = async (outfitId: string): Promise<Outfit> => {
  // Récupérer les détails de la tenue avec l'utilisateur
  const { data: outfitData, error: outfitError } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      user:user_id (*),
      likes:likes(
        id,
        user_id
      ),
      clothes:clothes_outfits(
        id,
        clothe_id,
        clothe:clothe_id(*)
      ),
      comments:comments!comments_outfit_id_fkey(
        id,
        outfit_id,
        user_id,
        content,
        created_at,
        user:users(*)
      )
    `)
    .eq('id', outfitId)
    .single();

  if (outfitError) {
    throw new Error(`Erreur lors de la récupération de la tenue: ${outfitError.message}`);
  }
  
  return outfitData;
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

export const counterLikes = async (outfitId: string) => {
  const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('outfit_id', outfitId);

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification du like: ${error.message}`);
  }
  return count;
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
      .from(TABLE_NAME)
      .delete()
      .eq('id', outfitId);
    if (log.error) {
      throw new Error(`Erreur lors de la suppression de la tenue: ${log.error.message}`);
    }

    // Si une image était associée à la tenue, la supprimer du stockage
    if (outfit.image_url) {
      const imagePath = outfit.image_url.split('/').slice(-2).join('/');
      
      if (imagePath) {
        const { error: storageError } = await supabase
          .storage
          .from(TABLE_NAME)
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

/**
 * Met à jour une tenue existante
 */
export const updateOutfit = async (id: string, updateData: Partial<{
  name: string;
  description: string;
  isPublic: boolean;
  gender: string;
  season: string;
  occasion: string;
}>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de la tenue: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Met à jour les vêtements associés à une tenue
 * Cette fonction supprime toutes les associations existantes et en crée de nouvelles
 */
export const updateOutfitClothes = async (outfitId: string, clothingIds: string[]): Promise<boolean> => {
  try {
    // 1. Supprimer toutes les associations existantes
    await deleteAllClotheOutfitByOutfitId(outfitId);

    return await associateClothesToOutfit(outfitId, clothingIds);
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

/**
 * Supprimer un commentaire
 * Un utilisateur ne peut supprimer que ses propres commentaires
 */
export const deleteComment = async (commentId: string, userId: string): Promise<boolean> => {
  try {
    // Vérifier d'abord que le commentaire appartient à l'utilisateur
    const { data: comment, error: checkError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      console.error('Erreur lors de la vérification du commentaire:', checkError);
      return false;
    }

    if (!comment) {
      return false; // Le commentaire n'appartient pas à l'utilisateur
    }

    // Supprimer le commentaire
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    return false;
  }
};

// Récupération des IDs des tenues likées par un utilisateur
export const fetchLikedOutfitIds = async (userId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .select('outfit_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Erreur lors de la récupération des likes:', error);
    return [];
  }

  return data?.map(like => like.outfit_id) || [];
}; 