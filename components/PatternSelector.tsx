import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PATTERNS } from '../constants/Clothes';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

interface PatternSelectorProps {
  selectedPattern: string | null;
  onPatternSelect: (patternKey: string) => void;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({ selectedPattern, onPatternSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

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
        { borderBottomColor: colors.text.lighter },
        selectedPattern === item[0] && [styles.patternItemSelected, { backgroundColor: colors.gray }]
      ]}
      onPress={() => selectPattern(item[0])}
    >
      <Text style={[
        styles.patternItemText,
        { color: colors.text.main },
        selectedPattern === item[0] && { color: colors.primary.main, fontWeight: 'bold' }
      ]}>
        {item[1]}
      </Text>
      {selectedPattern === item[0] && (
        <Ionicons name="checkmark" size={20} color={colors.primary.main} />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity 
        style={[styles.patternSelector, { backgroundColor: colors.gray }]} 
        onPress={openModal}
      >
        <Text style={[styles.patternSelectorText, { color: colors.text.main }]}>
          {selectedPattern ? PATTERNS[selectedPattern as keyof typeof PATTERNS] : 'Sélectionner un motif'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.main }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.text.lighter }]}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.main} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text.main }]}>Sélectionner un motif</Text>
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  patternSelectorText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  patternList: {
    paddingVertical: 15,
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  patternItemSelected: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97A5C',
  },
  patternItemText: {
    fontSize: 18,
  },
});

export default PatternSelector; 