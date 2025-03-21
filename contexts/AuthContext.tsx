import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../constants/Supabase';
import { User } from '../types';
import { Alert } from 'react-native';

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

  useEffect(() => {
    // Écouter les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      setSession(session);
      setLoading(true);
      
      if (session?.user) {
        // Récupérer les informations complètes de l'utilisateur depuis la base de données
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (data) {
          console.log("User data found:", data.username);
          setUser(data);
        } else {
          console.log("No user data found, creating profile");
          // Si l'utilisateur n'existe pas dans la table users, créer un profil
          try {
            // Vérifier d'abord si la table existe
            const { error: tableCheckError } = await supabase
              .from('users')
              .select('count')
              .limit(1);
            
            if (tableCheckError) {
              console.error("Erreur lors de la vérification de la table:", tableCheckError);
              Alert.alert(
                "Erreur de configuration",
                "La table 'users' n'existe pas ou n'est pas accessible. Veuillez contacter l'administrateur."
              );
              setLoading(false);
              return;
            }
            
            // Créer le profil utilisateur
            const userData = { 
              id: session.user.id,
              email: session.user.email,
              username: session.user.user_metadata?.username || 'Utilisateur',
              created_at: new Date().toISOString()
            };
            
            console.log("Tentative de création du profil avec:", userData);
            
            const { data: insertData, error: profileError } = await supabase
              .from('users')
              .insert([userData])
              .select();
            
            if (profileError) {
              console.error("Erreur détaillée lors de la création du profil:", JSON.stringify(profileError));
              
              // Vérifier si l'erreur est due à une contrainte unique
              if (profileError.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
                console.log("L'utilisateur existe déjà, tentative de récupération");
                // Essayer de récupérer l'utilisateur existant
                const { data: existingUser } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (existingUser) {
                  setUser(existingUser);
                }
              } else {
                Alert.alert(
                  "Erreur de profil",
                  "Impossible de créer votre profil. Veuillez vous déconnecter et réessayer."
                );
              }
            } else if (insertData && insertData.length > 0) {
              console.log("Profil créé avec succès:", insertData[0]);
              setUser(insertData[0]);
            }
          } catch (err) {
            console.error("Exception lors de la création du profil:", err);
          }
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Vérifier la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Current session:", session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data) {
              console.log("User data found on init:", data.username);
              setUser(data);
            } else {
              console.log("No user data found on init, will be created on auth change");
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
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
      
      // Étape 2: Connecter automatiquement l'utilisateur
      // Note: Supabase connecte automatiquement l'utilisateur après l'inscription,
      // donc nous n'avons pas besoin de faire un signIn explicite
      
      // Étape 3: Créer le profil utilisateur dans la table users
      // Vérifier d'abord si la table existe
      const { error: tableCheckError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      // Si la table n'existe pas, on ne tente pas d'insérer
      if (tableCheckError) {
        console.error("Erreur lors de la vérification de la table:", tableCheckError);
        return { error: null }; // On continue quand même pour permettre l'inscription
      }
      
      // Si la table existe, on insère le profil
      const userData = { 
        id: authData.user.id,
        email,
        username,
        created_at: new Date().toISOString()
      };
      
      console.log("Tentative de création du profil lors de l'inscription avec:", userData);
      
      const { error: profileError } = await supabase
        .from('users')
        .insert([userData]);
      
      if (profileError) {
        console.error("Erreur détaillée lors de la création du profil:", JSON.stringify(profileError));
      }
      
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
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { error: new Error('Utilisateur non connecté') };
    
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id);
      
    if (!error && user) {
      setUser({ ...user, ...data });
    }
    
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}; 