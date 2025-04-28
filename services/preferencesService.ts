import { supabase } from '../constants/Supabase';

export const getPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur lors de la récupération des préférences: ${error.message}`);
  }

  return data;
};

export const updatePreferences = async (userId: string, styles: string[]) => {
  // Vérifier d'abord si les préférences existent
  const { data: existingPreferences, error: checkError } = await supabase
    .from('preferences')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 est le code d'erreur pour "aucun résultat"
    throw new Error(`Erreur lors de la vérification des préférences: ${checkError.message}`);
  }

  const { data, error } = await supabase
    .from('preferences')
    .upsert({
      id: existingPreferences?.id,
      user_id: userId,
      styles,
      created_at: existingPreferences ? undefined : new Date().toISOString(), // Ne mettre à jour created_at que pour les nouvelles entrées
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour des préférences: ${error.message}`);
  }

  return data;
}; 