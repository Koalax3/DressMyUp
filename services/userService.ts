import { supabase } from '../constants/Supabase';
import { User } from '../types';
import { decode } from 'base64-arraybuffer';

// Récupération des informations d'un utilisateur
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Erreur lors de la récupération du profil: ${error.message}`);
  }

  return data;
};

// Mise à jour du profil utilisateur
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Omit<User, 'id' | 'created_at'>>
) => {
  const { data, error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', userId)
    .select();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
  }

  return data?.[0];
};

// Téléchargement d'un avatar
export const uploadAvatar = async (
  userId: string,
  base64Image: string
) => {
  try {
    const fileName = `avatars/${userId}/${Date.now()}.jpg`;
    const contentType = 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, decode(base64Image), {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erreur lors du téléchargement de l'avatar: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Erreur lors du téléchargement de l'avatar: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Récupération des statistiques de l'utilisateur
export const fetchUserStats = async (userId: string) => {
  try {
    // Récupérer le nombre de tenues
    const { count: outfitsCount, error: outfitsError } = await supabase
      .from('outfits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (outfitsError) {
      throw new Error(`Erreur lors de la récupération des tenues: ${outfitsError.message}`);
    }

    // Récupérer le nombre d'abonnés
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userId);

    if (followersError) {
      throw new Error(`Erreur lors de la récupération des abonnés: ${followersError.message}`);
    }

    // Récupérer le nombre d'abonnements
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (followingError) {
      throw new Error(`Erreur lors de la récupération des abonnements: ${followingError.message}`);
    }

    return {
      outfitsCount: outfitsCount || 0,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
    };
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// Récupération des followers d'un utilisateur
export const fetchFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      follower:follower_id (*)
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des followers: ${error.message}`);
  }

  return data?.map(item => item.follower) || [];
};

// Récupération des utilisateurs suivis
export const fetchFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      *,
      following:following_id (*)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erreur lors de la récupération des utilisateurs suivis: ${error.message}`);
  }

  return data?.map(item => item.following) || [];
};

// Suivre/Ne plus suivre un utilisateur
export const toggleFollow = async (userId: string, followedId: string) => {
  if (userId === followedId) {
    throw new Error("Vous ne pouvez pas vous suivre vous-même");
  }

  // Vérifier si la relation existe déjà
  const { data: existingFollow, error: checkError } = await supabase
    .from('follows')
    .select('*')
    .eq('user_id', userId)
    .eq('followed_id', followedId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification de l'abonnement: ${checkError.message}`);
  }

  if (existingFollow) {
    // Supprimer la relation (unfollow)
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('id', existingFollow.id);

    if (deleteError) {
      throw new Error(`Erreur lors du désabonnement: ${deleteError.message}`);
    }

    return false; // A cessé de suivre
  } else {
    // Créer la relation (follow)
    const { error: insertError } = await supabase
      .from('follows')
      .insert([
        {
          user_id: userId,
          followed_id: followedId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      throw new Error(`Erreur lors de l'abonnement: ${insertError.message}`);
    }

    return true; // A commencé à suivre
  }
};

// Vérifier si un utilisateur suit un autre utilisateur
export const checkIfFollowing = async (userId: string, followedId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('user_id', userId)
    .eq('followed_id', followedId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification de l'abonnement: ${error.message}`);
  }

  return !!data;
};

// Récupération des données complètes d'un utilisateur (profil, statistiques, tenues)
export const fetchUserCompleteData = async (userId: string) => {
  try {
    // Récupérer le profil de l'utilisateur
    const userProfile = await fetchUserProfile(userId);
    
    // Récupérer les statistiques de l'utilisateur
    const userStats = await fetchUserStats(userId);
    
    // Calculer le nombre total de likes reçus
    const { data: outfits } = await supabase
      .from('outfits')
      .select(`
        id,
        likes (id)
      `)
      .eq('user_id', userId);
    
    // Compter tous les likes reçus par les tenues de l'utilisateur
    const likesCount = outfits?.reduce((total, outfit) => total + (outfit.likes?.length || 0), 0) || 0;
    
    // Retourner les données complètes
    return {
      profile: userProfile,
      stats: {
        ...userStats,
        likesCount
      },
      isFollowing: false // Par défaut, sera mis à jour dans le composant si nécessaire
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    throw new Error(`Erreur lors de la récupération des données utilisateur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}; 