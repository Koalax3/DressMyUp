import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MATERIALS } from '@/constants/Materials';

type MaterialSelectorProps = {
  selectedMaterial: string | null;
  onMaterialSelect: (material: string | null) => void;
};

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  selectedMaterial,
  onMaterialSelect
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchText('');
  };

  const selectMaterial = (material: string) => {
    onMaterialSelect(material);
    closeModal();
  };

  // Filtrer les matériaux en fonction de la recherche
  const filteredMaterials = Object.entries(MATERIALS)
    .filter(([key, value]) => 
      value.toLowerCase().includes(searchText.toLowerCase()) ||
      key.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => a[1].localeCompare(b[1]));

  const renderMaterialItem = ({ item }: { item: [string, string] }) => (
    <TouchableOpacity
      style={[
        styles.materialItem,
        selectedMaterial === item[0] && styles.materialItemSelected
      ]}
      onPress={() => selectMaterial(item[0])}
    >
      <Text style={styles.materialName}>{item[1]}</Text>
      {selectedMaterial === item[0] && (
        <Ionicons name="checkmark" size={18} color="#F97A5C" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={openModal}
      >
        <Text style={styles.selectorText}>
          {selectedMaterial ? MATERIALS[selectedMaterial] : "Sélectionner un matériau"}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sélectionner un matériau</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un matériau..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {filteredMaterials.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun matériau trouvé</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMaterials}
              renderItem={renderMaterialItem}
              keyExtractor={item => item[0]}
              contentContainerStyle={styles.materialList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  selectorText: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    margin: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  materialList: {
    padding: 15,
    paddingTop: 0,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  materialItemSelected: {
    backgroundColor: '#f9f9f9',
  },
  materialName: {
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MaterialSelector; 