import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../constants/Supabase';
import { User } from '../types';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import LoadingView from '@/components/LoadingView';

type AuthContextType = {
  user: User | null;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les données utilisateur avec plus de robustesse
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      console.log("Récupération des informations de l'utilisateur:", userId);
      
      const response = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
      
      if (response.error) {
        console.error("Erreur lors de la récupération des données utilisateur:", response.error);
        return null;
      }
      
      if (!response.data) {
        console.log("Aucune donnée utilisateur trouvée");
        return null;
      }
      
      console.log("Données utilisateur récupérées avec succès:", response.data.username);
      return response.data;
    } catch (error) {
      console.error("Exception lors de la récupération des données utilisateur:", error);
      return null;
    }
  };

  // Fonction pour créer un profil utilisateur
  const createUserProfile = async (sessionUser: any): Promise<User | null> => {
    try {
      // Vérifier d'abord si la table existe
      console.log("Vérification de l'existence de la table users");
      const { error: tableCheckError } = await supabase.from('users').select('count').limit(1);
      
      if (tableCheckError) {
        console.error("Erreur lors de la vérification de la table:", tableCheckError);
        Alert.alert(
          "Erreur de configuration",
          "La table 'users' n'existe pas ou n'est pas accessible. Veuillez contacter l'administrateur."
        );
        return null;
      }
      
      // Créer le profil utilisateur
      const userData = { 
        id: sessionUser.id,
        email: sessionUser.email,
        username: sessionUser.user_metadata?.username || 'Utilisateur',
        created_at: new Date().toISOString()
      };
      
      console.log("Tentative de création du profil avec:", userData);
      
      const { data: insertData, error: profileError } = await supabase.from('users').insert([userData]).select();
      
      if (profileError) {
        console.error("Erreur détaillée lors de la création du profil:", JSON.stringify(profileError));
        
        // Vérifier si l'erreur est due à une contrainte unique
        if (profileError.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
          console.log("L'utilisateur existe déjà, tentative de récupération");
          // Récupérer l'utilisateur existant
          return await fetchUserData(sessionUser.id);
        } else {
          Alert.alert(
            "Erreur de profil",
            "Impossible de créer votre profil. Veuillez vous déconnecter et réessayer."
          );
          return null;
        }
      }
      
      if (insertData && insertData.length > 0) {
        console.log("Profil créé avec succès:", insertData[0]);
        return insertData[0];
      }
      
      return null;
    } catch (err) {
      console.error("Exception lors de la création du profil:", err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Fonction pour gérer le changement d'état d'authentification
    const handleAuthChange = async (event: string, currentSession: any) => {
      console.log("Événement d'authentification:", event);
      if (event === 'TOKEN_REFRESHED') {
        return;
      }
      if (!isMounted) return;
      
      setSession(currentSession);
      setLoading(true);
      
      try {
        if (currentSession?.user) {
          // Attendre un court instant pour s'assurer que le token est bien rafraîchi
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Récupérer les informations de l'utilisateur
          let userData = await fetchUserData(currentSession.user.id);
          
          // Si aucune donnée utilisateur n'est trouvée, essayer de créer un profil
          if (!userData) {
            // Vérifier d'abord si la table existe
            console.log("Vérification de l'existence de la table users");
            const { error: tableCheckError } = await supabase.from('users').select('count').limit(1);
            
            if (tableCheckError) {
              console.error("Erreur lors de la vérification de la table:", tableCheckError);
              Alert.alert(
                "Erreur de configuration",
                "La table 'users' n'existe pas ou n'est pas accessible. Veuillez contacter l'administrateur."
              );
              return;
            }

            // Créer le profil utilisateur
            const newUserData = { 
              id: currentSession.user.id,
              email: currentSession.user.email,
              username: currentSession.user.user_metadata?.username || 'Utilisateur',
              created_at: new Date().toISOString()
            };
            
            console.log("Tentative de création du profil avec:", newUserData);
            
            const { data: insertData, error: profileError } = await supabase.from('users').insert([newUserData]).select();
            
            if (profileError) {
              console.error("Erreur détaillée lors de la création du profil:", JSON.stringify(profileError));
              
              // Vérifier si l'erreur est due à une contrainte unique
              if (profileError.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
                console.log("L'utilisateur existe déjà, tentative de récupération");
                // Récupérer l'utilisateur existant
                userData = await fetchUserData(currentSession.user.id);
              } else {
                Alert.alert(
                  "Erreur de profil",
                  "Impossible de créer votre profil. Veuillez vous déconnecter et réessayer."
                );
                return;
              }
            } else if (insertData && insertData.length > 0) {
              userData = insertData[0];
            }
          }
          
          if (isMounted) {
            setUser(userData);
          }
        } else {
          if (isMounted) {
            setUser(null);
            // Seulement rediriger vers login si l'événement est une déconnexion
            if (event === 'SIGNED_OUT') {
              router.replace('/auth/login');
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement de l'authentification:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Vérifier la session actuelle
    const checkCurrentSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Session actuelle:", currentSession?.user?.id);
        
        if (currentSession) {
          await handleAuthChange('INITIAL_SESSION', currentSession);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        setLoading(false);
      }
    };

    checkCurrentSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Étape 1: Créer l'utilisateur dans l'authentification Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      
      if (authError) {
        console.error("Erreur d'authentification:", authError);
        return { error: authError };
      }
      
      if (!authData.user) {
        return { error: new Error("Échec de la création de l'utilisateur") };
      }
      
      // Supabase connecte automatiquement l'utilisateur après l'inscription
      // Le profil sera créé lors du changement d'état d'authentification
      
      return { error: null };
    } catch (error) {
      console.error("Erreur inattendue:", error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Erreur de connexion:", error);
        return { error };
      }
      
      console.log("Connexion réussie:", data.user?.id);
      return { error: null };
    } catch (error) {
      console.error("Erreur inattendue lors de la connexion:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      Alert.alert("Erreur", "Impossible de vous déconnecter. Veuillez réessayer.");
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { error: new Error('Utilisateur non connecté') };
    
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
        
      if (!error && user) {
        setUser({ ...user, ...data });
      }
      
      return { error };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateProfile }}>
      {loading ? <LoadingView /> : children}
    </AuthContext.Provider>
  );
};

export const SessionIsActive = async () => {
  const { data, error } = await supabase.auth.getSession();
  return data.session !== null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}; 