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
import { isDressMatch, isPerfectMatch, isSimilarMatch } from "@/services/matchingService";
import { useTheme } from "@/contexts/ThemeContext";
import { getThemeColors } from "@/constants/Colors";

// Définir les types de matching
export enum MatchType {
  DRESS_MATCH = 'dress_match',   // Vert - Tout match ou tout sauf la coupe
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
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);

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
          if (isDressMatch(item, clothingItem)) {
            return setMatchType(MatchType.DRESS_MATCH);
          }
          const perfectMatch = isPerfectMatch(item, clothingItem);
          // Vérifier les correspondances similaires (au moins couleur, subtype et matière)
          const similarMatch = isSimilarMatch(item, clothingItem);
          
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
        return { borderColor: colors.primary.main }; // Couleur primaire pour indiquer la sélection
      }
      
      // Sinon, si on doit afficher le statut de correspondance
      if (showMatchStatus) {
        switch (matchType) {
          case MatchType.PERFECT:
          case MatchType.DRESS_MATCH:
            return { backgroundColor: colors.match.lighter }; // Vert clair
          case MatchType.SIMILAR:
            return { backgroundColor: colors.similar.lighter }; // Orange clair
          case MatchType.NONE:
          default:
            return { backgroundColor: colors.background.deep }; // Couleur de fond appropriée
        }
      }
      
      // Par défaut
      return { backgroundColor: colors.background.deep };
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
                <Text style={[styles.clothingName, { color: colors.text.main }]}>{clothingItem.name}</Text>
                <Text style={[styles.clothingType, { color: colors.text.light }]}>
                  {types[clothingItem.type]} - {subtypesByType[clothingItem.type][clothingItem.subtype]}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
              </View>
              {matchType === MatchType.DRESS_MATCH && (
                <View style={styles.dressMatch}>
                  <Image source={require('@/assets/images/dress-match.png')} style={styles.dressMatchImage} />
                </View>
              )}
            </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    clothingItem: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent'
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
      },
      clothingType: {
        fontSize: 14,
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
      },
      dressMatch: {
        position: 'absolute',
        top: 5,
        left: 5,
      },
      dressMatchImage: {
        width: 25,
        height: 25,
        objectFit: 'contain',
      },
});
