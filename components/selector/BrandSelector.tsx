import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, TextInput, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRANDS } from '@/constants/Clothes';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

interface BrandSelectorProps {
  selectedBrand: string | null;
  onBrandSelect: (brandName: string) => void;
}

const BrandSelector: React.FC<BrandSelectorProps> = ({ selectedBrand, onBrandSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  
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
      style={[styles.brandItem, { borderBottomColor: colors.text.lighter }]}
      onPress={() => selectBrand(item)}
    >
      <Text style={[styles.brandName, { color: colors.text.main }]}>{item}</Text>
      {item === selectedBrand && (
        <Ionicons name="checkmark" size={18} color={colors.primary.main} />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity 
        style={[styles.brandSelector, { backgroundColor: colors.gray }]} 
        onPress={openModal}
      >
        <Text style={[styles.brandSelectorText, { color: colors.text.main }]}>
          {selectedBrand || "Sélectionner une marque"}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.light} />
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
            <Text style={[styles.modalTitle, { color: colors.text.main }]}>Sélectionner une marque</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={[styles.searchContainer, { backgroundColor: colors.gray }]}>
            <Ionicons name="search" size={20} color={colors.text.light} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.main }]}
              placeholder="Rechercher une marque..."
              value={brandSearch}
              onChangeText={setBrandSearch}
              placeholderTextColor={colors.text.light}
            />
            {brandSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBrandSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.text.light} />
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
                  style={[styles.customBrandItem, 
                    { 
                      borderBottomColor: colors.text.lighter,
                      backgroundColor: colors.gray
                    }
                  ]}
                  onPress={() => selectBrand(brandSearch)}
                >
                  <Text style={[styles.customBrandText, { color: colors.primary.main }]}>
                    Utiliser "{brandSearch}" comme marque
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyListContainer}>
                  <Text style={[styles.emptyListText, { color: colors.text.light }]}>
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  brandSelectorText: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  brandName: {
    fontSize: 16,
  },
  customBrandItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  customBrandText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
  },
});

export default BrandSelector; 