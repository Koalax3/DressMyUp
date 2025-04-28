import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/Clothes';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

interface MultiColorDisplayProps {
  colorString: string | null;
  textStyle?: object;
}

const MultiColorDisplay: React.FC<MultiColorDisplayProps> = ({ 
  colorString, 
  textStyle = {},
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  // Récupérer les objets de couleur pour l'affichage
  const getSelectedColorObjects = () => {
    if (!colorString) return [];
    const colorIds = colorString.split(', ');
    return colorIds.map(id => COLORS.find(c => c.id === id)).filter(Boolean);
  };

  const selectedColorObjects = getSelectedColorObjects();

  // Préparation du texte d'affichage
  const getDisplayText = () => {
    if (!colorString || selectedColorObjects.length === 0) {
      return "Aucune couleur";
    }
    
    if (selectedColorObjects.length === 1) {
      return selectedColorObjects[0]?.name;
    }
    
    if (selectedColorObjects.length === 2) {
      return `${selectedColorObjects[0]?.name}, ${selectedColorObjects[1]?.name}`;
    }
    
    return `${selectedColorObjects[0]?.name}, ${selectedColorObjects[1]?.name} + ${selectedColorObjects.length - 2}`;
  };

  return (
    <View style={styles.container}>
      {selectedColorObjects.length > 0 && (
        <View style={styles.colorCirclesContainer}>
          {selectedColorObjects.slice(0, 2).map((colorObj, index) => (
            <View 
              key={index}
              style={[
                styles.colorCircle, 
                index === 1 ? { marginLeft: -10, zIndex: -1 } : {}, 
                { 
                  backgroundColor: colorObj?.value === 'linear-gradient' 
                    ? 'transparent' 
                    : colorObj?.value,
                }
              ]}
            >
              {colorObj?.value === 'linear-gradient' && (
                <View style={styles.multicolorCircle}>
                  <View style={[styles.multiColorSegment, { backgroundColor: '#FF0000', top: 0, left: 0 }]} />
                  <View style={[styles.multiColorSegment, { backgroundColor: '#00FF00', top: 0, right: 0 }]} />
                  <View style={[styles.multiColorSegment, { backgroundColor: '#0000FF', bottom: 0, left: 0 }]} />
                  <View style={[styles.multiColorSegment, { backgroundColor: '#FFFF00', bottom: 0, right: 0 }]} />
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      <Text style={[styles.text, textStyle, { color: colors.text.main }]}>{getDisplayText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCirclesContainer: {
    flexDirection: 'row',
    marginRight: 10,
    alignItems: 'center',
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  multicolorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  multiColorSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  text: {
    fontSize: 16,
  },
});

export default MultiColorDisplay; 