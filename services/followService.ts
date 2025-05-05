import { supabase } from '@/constants/Supabase';

// Récupération des followers (fans) d'un utilisateur
export const fetchFollowers = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        user_id,
        users:user_id (
          id,
          email,
          username,
          avatar_url,
          bio,
          created_at
        )
      `)
      .eq('followed_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des followers: ${error.message}`);
    }

    // Transformer les données pour n'avoir que les utilisateurs
    return data?.map(item => item.users) || [];
  } catch (error) {
    console.error('Erreur dans fetchFollowers:', error);
    throw error;
  }
};

// Récupération des personnes suivies par un utilisateur
export const fetchFollowing = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        followed_id,
        users:followed_id (
          id,
          email,
          username,
          avatar_url,
          bio,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des abonnements: ${error.message}`);
    }

    // Transformer les données pour n'avoir que les utilisateurs
    return data?.map(item => item.users) || [];
  } catch (error) {
    console.error('Erreur dans fetchFollowing:', error);
    throw error;
  }
};

// Vérifier si un utilisateur suit un autre utilisateur
export const checkIfFollowing = async (userId: string, followedId: string) => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('user_id', userId)
      .eq('followed_id', followedId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erreur lors de la vérification de l'abonnement: ${error.message}`);
    }

    return !!data;
  } catch (error) {
    console.error('Erreur dans checkIfFollowing:', error);
    throw error;
  }
};

// Suivre un utilisateur
export const followUser = async (followerId: string, followingId: string) => {
  try {
    // Vérifier si l'utilisateur ne tente pas de se suivre lui-même
    if (followerId === followingId) {
      throw new Error("Vous ne pouvez pas vous suivre vous-même");
    }

    // Vérifier si la relation existe déjà
    const isAlreadyFollowing = await checkIfFollowing(followerId, followingId);
    if (isAlreadyFollowing) {
      return true; // Déjà abonné
    }

    // Créer la relation (follow)
    const { error } = await supabase
      .from('follows')
      .insert([
        {
          user_id: followerId,
          followed_id: followingId,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      throw new Error(`Erreur lors de l'abonnement: ${error.message}`);
    }

    return true; // Abonnement réussi
  } catch (error) {
    console.error('Erreur dans followUser:', error);
    throw error;
  }
};

// Se désabonner d'un utilisateur
export const unfollowUser = async (followerId: string, followingId: string) => {
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', followerId)
      .eq('followed_id', followingId);

    if (error) {
      throw new Error(`Erreur lors du désabonnement: ${error.message}`);
    }

    return true; // Désabonnement réussi
  } catch (error) {
    console.error('Erreur dans unfollowUser:', error);
    throw error;
  }
};

// Basculer l'état d'abonnement (suivre/ne plus suivre)
export const toggleFollow = async (followerId: string, followingId: string) => {
  try {
    const isFollowing = await checkIfFollowing(followerId, followingId);
    
    if (isFollowing) {
      await unfollowUser(followerId, followingId);
      return false; // A cessé de suivre
    } else {
      await followUser(followerId, followingId);
      return true; // A commencé à suivre
    }
  } catch (error) {
    console.error('Erreur dans toggleFollow:', error);
    throw error;
  }
}; 