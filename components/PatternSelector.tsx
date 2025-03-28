import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PATTERNS } from '../constants/Clothes';

interface PatternSelectorProps {
  selectedPattern: string | null;
  onPatternSelect: (patternKey: string) => void;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({ selectedPattern, onPatternSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const selectPattern = (patternKey: string) => {
    onPatternSelect(patternKey);
    closeModal();
  };

  const renderPatternItem = ({ item }: { item: [string, string] }) => (
    <TouchableOpacity
      style={[
        styles.patternItem,
        selectedPattern === item[0] && styles.patternItemSelected
      ]}
      onPress={() => selectPattern(item[0])}
    >
      <Text style={[
        styles.patternItemText,
        selectedPattern === item[0] && styles.patternItemTextSelected
      ]}>
        {item[1]}
      </Text>
      {selectedPattern === item[0] && (
        <Ionicons name="checkmark" size={20} color="#F97A5C" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity 
        style={styles.patternSelector} 
        onPress={openModal}
      >
        <Text style={styles.patternSelectorText}>
          {selectedPattern ? PATTERNS[selectedPattern as keyof typeof PATTERNS] : 'Sélectionner un motif'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Sélectionner un motif</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <FlatList
              data={Object.entries(PATTERNS)}
              renderItem={renderPatternItem}
              keyExtractor={(item) => item[0]}
              contentContainerStyle={styles.patternList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  patternSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  patternSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  patternList: {
    padding: 15,
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patternItemSelected: {
    backgroundColor: '#f9f9f9',
  },
  patternItemText: {
    fontSize: 16,
    color: '#333',
  },
  patternItemTextSelected: {
    fontWeight: 'bold',
    color: '#F97A5C',
  },
});

export default PatternSelector; 