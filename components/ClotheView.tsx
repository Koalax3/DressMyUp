import { router } from "expo-router";
import { Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { View } from "react-native";
import { ClothingItem } from "@/types";
import { types, subtypesByType } from "@/constants/Clothes";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/constants/Supabase";
import { ColorsTheme } from "@/constants/Colors";

// Définir les types de matching
export enum MatchType {
  PERFECT = 'perfect',   // Vert - Tout match ou tout sauf la coupe
  SIMILAR = 'similar',   // Orange - Au moins couleur, subtype et matière
  NONE = 'none'          // Rouge - Pas de concordance
}

type ClotheViewProps = {
  clothingItem: ClothingItem;
  userWardrobeItems?: ClothingItem[];
  showMatchStatus?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
  onPress?: (item: ClothingItem) => void;
};

export default function ClotheView({ 
  clothingItem, 
  userWardrobeItems,
  showMatchStatus = false,
  selectable = false,
  selected = false,
  onSelectToggle,
  onPress
}: ClotheViewProps) {
    const { user } = useAuth();
    const [matchType, setMatchType] = useState<MatchType>(MatchType.NONE);
    useEffect(() => {
      if (showMatchStatus && user) {
        checkMatching();
      }
    }, [clothingItem, userWardrobeItems, showMatchStatus]);

    const checkMatching = async () => {
      if (!user) return;
            
      try {
        // Si les vêtements de la garde-robe sont fournis, utiliser ceux-ci
        let wardrobeItems = userWardrobeItems;
        
        // Sinon, récupérer les vêtements de la garde-robe depuis la base de données
        if (!wardrobeItems) {
          const { data, error } = await supabase
            .from('clothes')
            .select('*')
            .eq('subtype', clothingItem.subtype)
            .eq('user_id', user.id);
            
          if (error) throw error;
          wardrobeItems = data as ClothingItem[];
        }
        
        // Filtrer pour exclure l'item actuel
        const otherItems = wardrobeItems?.filter(item => item.id !== clothingItem.id) || [];
        
        // Chercher les correspondances
        const perfectMatches: ClothingItem[] = [];
        const similarMatches: ClothingItem[] = [];
        for (const item of otherItems) {
          // Vérifier les correspondances parfaites
          const perfectMatch = 
            item.color === clothingItem.color &&
            item.subtype === clothingItem.subtype &&
            (item.material === clothingItem.material || !clothingItem.material) &&
            (item.pattern === clothingItem.pattern || !clothingItem.pattern) &&
            (item.brand === clothingItem.brand || !clothingItem.brand);
          // Vérifier les correspondances similaires (au moins couleur, subtype et matière)
          const similarMatch = 
            item.color === clothingItem.color &&
            item.subtype === clothingItem.subtype &&
            (item.material === clothingItem.material || !clothingItem.material);
          
          if (perfectMatch) {
            perfectMatches.push(item);
          } else if (similarMatch) {
            similarMatches.push(item);
          }
        }
        
        // Déterminer le type de correspondance
        if (perfectMatches.length > 0) {
          setMatchType(MatchType.PERFECT);
        } else if (similarMatches.length > 0) {
          setMatchType(MatchType.SIMILAR);
        } else {
          setMatchType(MatchType.NONE);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des correspondances:", error);
        setMatchType(MatchType.NONE);
      }
    };

    // Déterminer la couleur du fond en fonction du type de correspondance
    const getBackgroundStyle = () => {
      // Si le composant est sélectionnable et qu'il est sélectionné
      if (selectable && selected) {
        return { backgroundColor: '#E7F5FF' }; // Bleu clair pour indiquer la sélection
      }
      
      // Sinon, si on doit afficher le statut de correspondance
      if (showMatchStatus) {
        switch (matchType) {
          case MatchType.PERFECT:
            return { backgroundColor: ColorsTheme.match.lighter }; // Vert clair
          case MatchType.SIMILAR:
            return { backgroundColor: ColorsTheme.similar.lighter }; // Orange clair
          case MatchType.NONE:
          default:
            return { backgroundColor: ColorsTheme.gray }; // Rouge clair
        }
      }
      
      // Par défaut
      return { backgroundColor: ColorsTheme.gray };
    };

    const handlePress = () => {
      if (selectable && onSelectToggle) {
        onSelectToggle(clothingItem.id);
        return;
      }
      
      if (onPress) {
        onPress(clothingItem);
        return;
      }
      
      // Comportement par défaut
      router.push({
        pathname: '/clothing/[id]',
        params: { 
          id: clothingItem.id
        }
      });
    };

    return (
        <TouchableOpacity 
              style={[styles.clothingItem, getBackgroundStyle()]}
              onPress={handlePress}
            >
              <Image source={{ uri: clothingItem.image_url }} style={styles.clothingImage} />
              <View style={styles.clothingInfo}>
                <Text style={styles.clothingName}>{clothingItem.name}</Text>
                <Text style={styles.clothingType}>
                  {types[clothingItem.type]} - {subtypesByType[clothingItem.type][clothingItem.subtype]}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    clothingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
      },
      clothingImage: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginRight: 15,
      },
      clothingInfo: {
        flex: 1,
      },
      clothingName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
      },
      clothingType: {
        fontSize: 14,
        color: '#999',
        marginTop: 2,
      },
      clothingBrand: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
      },
      rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      statusIcon: {
        marginRight: 8,
      },
      checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        marginRight: 10,
      },
      checkboxSelected: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      }
});
