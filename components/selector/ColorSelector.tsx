import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Clothes';
import ColorDot from '@/components/ColorDot';
import MultiColorDisplay from '@/components/MultiColorDisplay';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';

interface ColorSelectorProps {
  selectedColor: string | null;
  onColorSelect: (colorId: string) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ selectedColor, onColorSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  
  // Initialiser les couleurs sélectionnées au chargement du composant
  useEffect(() => {
    if (selectedColor) {
      setSelectedColors(selectedColor.split(', '));
    } else {
      setSelectedColors([]);
    }
  }, [selectedColor]);

  const openModal = () => {
    // Réinitialiser la sélection temporaire quand on ouvre le modal
    if (selectedColor) {
      setSelectedColors(selectedColor.split(', '));
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleColorSelection = (colorId: string) => {
    setSelectedColors(prevSelected => {
      if (prevSelected.includes(colorId)) {
        return prevSelected.filter(id => id !== colorId);
      } else {
        return [...prevSelected, colorId];
      }
    });
  };

  const confirmSelection = () => {
    if (selectedColors.length > 0) {
      onColorSelect(selectedColors.join(', '));
    } else {
      onColorSelect('');
    }
    closeModal();
  };

  // Récupérer les objets de couleur pour l'affichage
  const getSelectedColorObjects = () => {
    if (!selectedColor) return [];
    const colorIds = selectedColor.split(', ');
    return colorIds.map(id => COLORS.find(c => c.id === id)).filter(Boolean);
  };

  const selectedColorObjects = getSelectedColorObjects();

  // Préparation du texte d'affichage
  const getDisplayText = () => {
    if (!selectedColor || selectedColorObjects.length === 0) {
      return t('clothing.selectColor');
    }
    
    if (selectedColorObjects.length === 1) {
      return selectedColorObjects[0]?.id;
    }
    
    if (selectedColorObjects.length === 2) {
      return `${selectedColorObjects[0]?.id}, ${selectedColorObjects[1]?.id}`;
    }
    
    return `${selectedColorObjects[0]?.id}, ${selectedColorObjects[1]?.id} + ${selectedColorObjects.length - 2}`;
  };

  const renderColorItem = ({ item }: { item: typeof COLORS[0] }) => (
    <TouchableOpacity
      style={[styles.colorItem, { borderBottomColor: colors.text.lighter }]}
      onPress={() => toggleColorSelection(item.id)}
    >
      <View style={styles.colorItemContent}>
        <ColorDot size={45} colorValue={item.value} />
        <Text style={[styles.colorName, { color: colors.text.main }]}>
          {t(`clothingColors.${item.id}`)}
        </Text>
      </View>
      {selectedColors.includes(item.id) && (
        <Ionicons name="checkmark" size={18} color={colors.primary.main} />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity 
        style={[styles.colorSelector, { backgroundColor: colors.gray }]} 
        onPress={openModal}
      >
        <MultiColorDisplay colorString={selectedColor} />
        <Ionicons name="chevron-forward" size={24} color={colors.text.light} />
        </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background.main }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.text.lighter }]}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.main} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text.main }]}>{t('clothing.selectColors')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <FlatList
            data={COLORS}
            renderItem={renderColorItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.colorList}
          />

          <View style={[styles.confirmButtonContainer, { 
            borderTopColor: colors.text.lighter, 
            backgroundColor: colors.background.main 
          }]}>
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                { backgroundColor: colors.primary.main },
                selectedColors.length === 0 && { opacity: 0.5 }
              ]}
              onPress={confirmSelection}
              disabled={selectedColors.length === 0}
            >
              <Text style={[styles.confirmButtonText, { color: colors.text.bright }]}>
                {t('common.confirm')} ({selectedColors.length} {selectedColors.length > 1 
                  ? t('clothing.colorsSelected') 
                  : t('clothing.colorSelected')})
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  colorSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  colorSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCirclesContainer: {
    flexDirection: 'row',
    marginRight: 10,
    alignItems: 'center',
  },
  selectedColorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorSelectorText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  colorList: {
    paddingVertical: 15,
    paddingBottom: 80, // Espace pour le bouton de confirmation
  },
  colorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  colorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  colorName: {
    fontSize: 18,
  },
  multiColorSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  multicolorCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  multiColorSegmentSmall: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 1,
  },
  confirmButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ColorSelector; 