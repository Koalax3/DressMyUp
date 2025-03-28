import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRANDS } from '../constants/Clothes';

interface BrandSelectorProps {
  selectedBrand: string | null;
  onBrandSelect: (brandName: string) => void;
}

const BrandSelector: React.FC<BrandSelectorProps> = ({ selectedBrand, onBrandSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  
  // Filtrer les marques en fonction de la recherche
  const filteredBrands = BRANDS.filter(b => 
    b.toLowerCase().includes(brandSearch.toLowerCase())
  ).sort((a, b) => a.localeCompare(b));

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setBrandSearch('');
  };

  const selectBrand = (brandName: string) => {
    onBrandSelect(brandName);
    closeModal();
  };

  const renderBrandItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.brandItem}
      onPress={() => selectBrand(item)}
    >
      <Text style={styles.brandName}>{item}</Text>
      {item === selectedBrand && (
        <Ionicons name="checkmark" size={18} color="#F97A5C" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity 
        style={styles.brandSelector} 
        onPress={openModal}
      >
        <Text style={styles.brandSelectorText}>
          {selectedBrand || "Sélectionner une marque"}
        </Text>
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
            <Text style={styles.modalTitle}>Sélectionner une marque</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une marque..."
              value={brandSearch}
              onChangeText={setBrandSearch}
              placeholderTextColor="#999"
            />
            {brandSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBrandSearch('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={filteredBrands}
            renderItem={renderBrandItem}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.brandList}
            ListEmptyComponent={
              brandSearch.length > 0 ? (
                <TouchableOpacity
                  style={styles.customBrandItem}
                  onPress={() => selectBrand(brandSearch)}
                >
                  <Text style={styles.customBrandText}>
                    Utiliser "{brandSearch}" comme marque
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>
                    Aucune marque trouvée
                  </Text>
                </View>
              )
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  brandSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  brandSelectorText: {
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
  brandList: {
    padding: 15,
    paddingTop: 0,
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brandName: {
    fontSize: 16,
    color: '#333',
  },
  customBrandItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  customBrandText: {
    fontSize: 16,
    color: '#F97A5C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default BrandSelector; 