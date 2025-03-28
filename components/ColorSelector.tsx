import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/Clothes';
import ColorDot from './ColorDot';

interface ColorSelectorProps {
  selectedColor: string | null;
  onColorSelect: (colorId: string) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ selectedColor, onColorSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Trouver l'objet couleur correspondant pour l'affichage
  const selectedColorObject = COLORS.find(c => c.id === selectedColor);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const selectColor = (colorId: string) => {
    onColorSelect(colorId);
    closeModal();
  };

  const renderColorItem = ({ item }: { item: typeof COLORS[0] }) => (
    <TouchableOpacity
      style={styles.colorItem}
      onPress={() => selectColor(item.id)}
    >
      <View style={styles.colorItemContent}>
        <ColorDot colorValue={item.value} />
        <Text style={styles.colorName}>
          {item.name}
        </Text>
      </View>
      {item.id === selectedColor && (
        <Ionicons name="checkmark" size={18} color="#F97A5C" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity 
        style={styles.colorSelector} 
        onPress={openModal}
      >
        <View style={styles.colorSelectorContent}>
          {selectedColorObject && (
            <View 
              style={[
                styles.selectedColorCircle, 
                { 
                  backgroundColor: selectedColorObject.value === 'linear-gradient' 
                    ? 'transparent' 
                    : selectedColorObject.value,
                }
              ]}
            >
              {selectedColorObject.value === 'linear-gradient' && (
                <View style={styles.multicolorCircleSmall}>
                  <View style={[styles.multiColorSegmentSmall, { backgroundColor: '#FF0000', top: 0, left: 0 }]} />
                  <View style={[styles.multiColorSegmentSmall, { backgroundColor: '#00FF00', top: 0, right: 0 }]} />
                  <View style={[styles.multiColorSegmentSmall, { backgroundColor: '#0000FF', bottom: 0, left: 0 }]} />
                  <View style={[styles.multiColorSegmentSmall, { backgroundColor: '#FFFF00', bottom: 0, right: 0 }]} />
                </View>
              )}
            </View>
          )}
          <Text style={styles.colorSelectorText}>
            {selectedColorObject?.name || "Sélectionner une couleur"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner une couleur</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <FlatList
            data={COLORS}
            renderItem={renderColorItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.colorList}
          />
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  colorSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedColorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  colorSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  colorList: {
    padding: 15,
  },
  colorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  colorName: {
    fontSize: 16,
    color: '#333',
  },
  multicolorCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
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
});

export default ColorSelector; 