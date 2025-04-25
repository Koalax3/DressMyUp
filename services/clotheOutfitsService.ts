import { supabase } from "@/constants/Supabase";

const TABLE_NAME = 'clothes_outfits';

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

export const deleteAllClotheOutfitByOutfitId = async (outfitId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('outfit_id', outfitId);

    if (error) {
      throw new Error(`Erreur lors de la suppression des associations: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
}

export const associateClothesToOutfit = async (outfitId: string, clothingIds: string[]): Promise<boolean> => {
  try {
    if (!clothingIds.length) return true;
    
    // Associer les vêtements à l'outfit avec des positions séquentielles
    const clothingAssociations = clothingIds.map((clothingId, index) => ({
      outfit_id: outfitId,
      clothe_id: clothingId,
      position: index
    }));

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert(clothingAssociations);

    if (error) {
      throw new Error(`Erreur lors de l'association des vêtements: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
};

export const updateClothesPositions = async (
  outfitId: string, 
  clothesPositions: { clotheId: string, position: number }[]
): Promise<boolean> => {
  try {
    // Créer un tableau de promesses pour les mises à jour
    const updatePromises = clothesPositions.map(({ clotheId, position }) => 
      supabase
        .from(TABLE_NAME)
        .update({ position })
        .eq('outfit_id', outfitId)
        .eq('clothe_id', clotheId)
    );

    // Exécuter toutes les promesses en parallèle
    await Promise.all(updatePromises);

    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des positions:', error);
    return false;
  }
};
