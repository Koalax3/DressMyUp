import { supabase } from '../constants/Supabase';
import { User } from '../types';

// Types pour l'authentification
export type AuthError = {
  message: string;
};

export type AuthSuccess = {
  user: User;
};

export type AuthResponse = {
  success: boolean;
  data?: AuthSuccess;
  error?: AuthError;
};

// Inscription d'un utilisateur
export const signUp = async (
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> => {
  try {
    // Vérifier si l'email est déjà utilisé
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        success: false,
        error: {
          message: 'Cet email est déjà utilisé',
        },
      };
    }

    // Créer un utilisateur dans la table auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      return {
        success: false,
        error: {
          message: signUpError?.message || 'Erreur lors de l\'inscription',
        },
      };
    }

    // Créer un profil utilisateur dans la table users
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          username,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError) {
      // Si la création du profil échoue, on devrait réellement nettoyer l'utilisateur auth
      // mais gardons ça simple pour l'exemple
      return {
        success: false,
        error: {
          message: 'Erreur lors de la création du profil',
        },
      };
    }

    return {
      success: true,
      data: {
        user: userData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
    };
  }
};

// Connexion d'un utilisateur
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      return {
        success: false,
        error: {
          message: signInError?.message || 'Identifiants incorrects',
        },
      };
    }

    // Récupérer le profil utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return {
        success: false,
        error: {
          message: 'Erreur lors de la récupération du profil',
        },
      };
    }

    return {
      success: true,
      data: {
        user: userData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      },
    };
  }
};

// Déconnexion
export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return false;
  }
};

// Récupération de la session utilisateur actuelle
export const getCurrentSession = async () => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      return null;
    }
    
    // Récupérer le profil utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();
      
    if (userError) {
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
};

// Réinitialisation du mot de passe
export const resetPassword = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return false;
  }
};

// Mise à jour du mot de passe
export const updatePassword = async (password: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    return false;
  }
}; 