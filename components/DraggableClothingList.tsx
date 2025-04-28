import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import DraggableFlatList, { 
  RenderItemParams, 
  ScaleDecorator 
} from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClothingItem } from '@/types';
import { getThemeColors } from '@/constants/Colors';
import { subtypesByType } from '@/constants/Clothes';
import { useTheme } from '@/contexts/ThemeContext';

type ClothingWithPosition = ClothingItem & { position?: number };

type DraggableClothingListProps = {
  items: ClothingWithPosition[];
  onDragEnd: (data: ClothingWithPosition[]) => void;
  onRemoveItem?: (id: string) => void;
};

// Obtenir les dimensions de l'écran pour un calcul plus précis de la hauteur
const { height: screenHeight } = Dimensions.get('window');

const DraggableClothingList: React.FC<DraggableClothingListProps> = ({
  items,
  onDragEnd,
  onRemoveItem
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  // Calculer une hauteur fixe en fonction du nombre d'éléments et de la taille de l'écran
  const calculateHeight = () => {
    const itemHeight = 90; // hauteur estimée de chaque élément
    const maxVisibleItems = 5; // limite le nombre d'éléments visibles
    const maxHeight = screenHeight * 0.6; // limite à 60% de la hauteur de l'écran
    
    const calculatedHeight = Math.min(
      items.length * itemHeight,
      maxVisibleItems * itemHeight,
      maxHeight
    );
    
    return Math.max(calculatedHeight, 100); // au moins 100px de hauteur
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ClothingWithPosition>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={0.7}
          onPressIn={drag}
          style={[
            styles.itemContainer,
            { 
              backgroundColor: isDarkMode ? colors.background.deep : '#fff',
              shadowColor: isDarkMode ? '#000' : '#000',
            },
            isActive && [
              styles.activeItem, 
              { 
                backgroundColor: isDarkMode ? colors.background.dark : '#f0f0f0',
                shadowColor: isDarkMode ? '#000' : '#000',
              }
            ]
          ]}
        >
          <View style={styles.dragWrapper}>
            <Ionicons name="menu" size={24} color={isDarkMode ? colors.primary.main : colors.secondary.main} style={styles.dragIcon} />
            <View style={styles.clotheViewContainer}>
              <Image source={{ uri: item.image_url }} style={[styles.clotheImage, { backgroundColor: isDarkMode ? colors.background.main : '#f5f5f5' }]} />
              <View style={styles.clotheDetails}>
                <Text style={[styles.clotheName, { color: colors.text.main }]} numberOfLines={1} ellipsizeMode="tail">
                  {item.name}
                </Text>
                <Text style={[styles.clotheSubtype, { color: isDarkMode ? colors.text.light : '#666' }]} numberOfLines={1}>
                  {subtypesByType[item.type as keyof typeof subtypesByType][item.subtype]}
                </Text>
              </View>
            </View>
            {onRemoveItem && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => onRemoveItem(item.id)}
              >
                <Ionicons name="close-circle" size={22} color={colors.primary.main} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <View style={[
      styles.container, 
      { 
        height: calculateHeight(),
        backgroundColor: isDarkMode ? colors.background.main : '#f7f7f7',
      }
    ]}>
      <DraggableFlatList
        data={items}
        onDragEnd={({ data }) => onDragEnd(data)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 5,
  },
  itemContainer: {
    marginBottom: 10,
    borderRadius: 8,
    padding: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeItem: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  dragWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragIcon: {
    marginRight: 10,
    marginLeft: 5,
  },
  clotheViewContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clotheImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  clotheDetails: {
    marginLeft: 10,
    flex: 1,
  },
  clotheName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clotheSubtype: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    marginLeft: 5,
  }
});

export default DraggableClothingList; 