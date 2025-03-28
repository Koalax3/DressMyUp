import { supabase } from "@/constants/Supabase";

export const deleteClotheOutfit = async (clotheId: string, outfitId: string) => {
    const { error: relationsError } = await supabase
      .from('clothes_outfits')
      .delete()
      .eq('clothe_id', clotheId)
      .eq('outfit_id', outfitId);
    
    if (relationsError) {
      throw new Error(`Erreur lors de la suppression des relations: ${relationsError.message}`);
    }
}

export const deleteAllClotheOutfitByOutfitId = async (outfitId: string) => {
  const { error: relationsError } = await supabase
    .from('clothes_outfits')
    .delete()
    .eq('outfit_id', outfitId);
  
  if (relationsError) {
    throw new Error(`Erreur lors de la suppression des relations: ${relationsError.message}`);
  }
}

export const associateClothesToOutfit = async (outfitId: string, clothingIds: string[]) => {
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
    throw new Error(`Erreur lors de l'association des vêtements: ${error.message}`);
  }

  return true;
}
