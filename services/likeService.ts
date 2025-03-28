import { supabase } from "@/constants/Supabase";

export const likeOutfit = async (outfitId: string, userId: string) => {
        const { data: existingLike, error: checkError } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', userId)
          .eq('outfit_id', outfitId)
          .single();
  
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Erreur lors de la vérification du like:', checkError);
          return;
        }
  
        if (existingLike) {
          // Supprimer le like
          const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('id', existingLike.id);
  
          if (deleteError) {
            console.error('Erreur lors de la suppression du like:', deleteError);
            return;
          }
  
          // Mettre à jour le compteur de likes
          await supabase.rpc('decrement_likes', { outfit_id: outfitId });
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
            console.error('Erreur lors de l\'ajout du like:', insertError);
            return;
          }
  
          // Mettre à jour le compteur de likes
          await supabase.rpc('increment_likes', { outfit_id: outfitId });
        }
}
