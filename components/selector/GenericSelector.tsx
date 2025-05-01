import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorsTheme } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { useTranslation } from '@/i18n/useTranslation';

export type Option = {
  key: string;
  label: string;
  icon?: {
    name: keyof typeof Ionicons.glyphMap;
    color?: string;
  };
};

interface GenericSelectorProps {
  // Propriétés de base
  options: Option[] | Record<string, string>;
  selectedOption: string | string[] | null;
  onOptionSelect: (option: string | string[]) => void;
  
  // Personnalisation de l'affichage
  title: string;
  placeholder?: string;
  multiSelect?: boolean;
  
  // Options visuelles
  displayIcon?: boolean;
  iconSize?: number;
  iconColor?: string;
  children?: (setModalVisible: (visible: boolean) => void) => React.ReactNode;
  
  // Propriétés de recherche
  searchable?: boolean;
  searchPlaceholder?: string;
  customHeader?: React.ReactNode;
}

const GenericSelector: React.FC<GenericSelectorProps> = ({
  options,
  selectedOption,
  onOptionSelect,
  title,
  placeholder,
  multiSelect = false,
  displayIcon = false,
  iconSize = 18,
  iconColor = ColorsTheme.primary.main,
  children,
  searchable = false,
  searchPlaceholder,
  customHeader
}) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const [localSelection, setLocalSelection] = useState<string[]>(
    multiSelect 
      ? (Array.isArray(selectedOption) ? selectedOption : selectedOption ? [selectedOption] : [])
      : []
  );

  // Valeurs par défaut avec internationalisation
  const defaultPlaceholder = placeholder || t('common.select');
  const defaultSearchPlaceholder = searchPlaceholder || t('common.search');

  // Convertir options en tableau d'objets si c'est un objet
  const optionsArray: Option[] = Array.isArray(options) 
    ? options 
    : Object.entries(options).map(([key, label]) => ({ key, label }));

  // Filtrer les options en fonction de la recherche si searchable est activé
  const filteredOptions = searchable && searchText.trim() !== ''
    ? optionsArray.filter(option => 
        option.label.toLowerCase().includes(searchText.toLowerCase()) || 
        option.key.toLowerCase().includes(searchText.toLowerCase())
      )
    : optionsArray;

  // Réinitialiser la recherche à la fermeture du modal
  useEffect(() => {
    if (!modalVisible) {
      setSearchText('');
    }
  }, [modalVisible]);

  const openModal = () => {
    // Initialiser la sélection locale avec la sélection actuelle
    setLocalSelection(
      multiSelect 
        ? (Array.isArray(selectedOption) ? selectedOption : selectedOption ? [selectedOption] : [])
        : selectedOption ? [selectedOption as string] : []
    );
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const toggleOption = (optionKey: string) => {
    if (multiSelect) {
      setLocalSelection(prev => 
        prev.includes(optionKey)
          ? prev.filter(key => key !== optionKey)
          : [...prev, optionKey]
      );
    } else {
      // Pour une sélection unique, on met à jour directement
      onOptionSelect(optionKey);
      closeModal();
    }
  };

  const confirmSelection = () => {
    if (multiSelect) {
      onOptionSelect(localSelection);
    }
    closeModal();
  };

  const getSelectedLabel = (): string => {
    if (!selectedOption) return defaultPlaceholder;
    
    if (multiSelect && Array.isArray(selectedOption)) {
        if (selectedOption.length === 0) return defaultPlaceholder;
        const options = optionsArray.filter(opt => selectedOption.includes(opt.key));
        if (options.length > 2) {
          return `${options[0].label} ${options[1].label} + ${options.length - 2} ${t('common.moreOptions')}`;
        }
        return options.map(opt => opt.label).join(', ');
    } else {
      const option = optionsArray.find(opt => opt.key === selectedOption);
      return option ? option.label : defaultPlaceholder;
    }
  };

  const renderOptionItem = ({ item }: { item: Option }) => {
    const isSelected = multiSelect 
      ? (Array.isArray(selectedOption) ? selectedOption.includes(item.key) : false)
      : selectedOption === item.key;

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          { borderBottomColor: colors.text.lighter },
          isSelected && [styles.optionItemSelected, { backgroundColor: colors.gray }]
        ]}
        onPress={() => toggleOption(item.key)}
      >
        <View style={styles.optionContent}>
          {item.icon && displayIcon && (
            <Ionicons 
              name={item.icon.name}
              size={iconSize} 
              color={isSelected ? iconColor : item.icon.color || colors.text.light} 
              style={styles.optionIcon}
            />
          )}
          <Text style={[
            styles.optionItemText,
            { color: colors.text.main },
            isSelected && styles.optionItemTextSelected
          ]}>
            {item.label}
          </Text>
        </View>
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color={colors.primary.main} 
            style={styles.checkmark}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderSearchBar = () => {
    if (!searchable) return null;
    
    return (
      <View style={[styles.searchContainer, { backgroundColor: colors.gray }]}>
        <Ionicons name="search" size={20} color={colors.text.light} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.main }]}
          placeholder={defaultSearchPlaceholder}
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.text.light}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.light} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyList = () => {
    if (!searchable || filteredOptions.length > 0) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          {t('common.noResults')}
        </Text>
      </View>
    );
  };

  return (
    <View style={{marginBottom: children ? 0 : 15}}>
      {children ? children(setModalVisible) : (
        <TouchableOpacity 
          style={[styles.selector, { backgroundColor: colors.gray }]} 
          onPress={()=>setModalVisible(true)}
        >
          <Text style={[styles.selectorText, { color: selectedOption ? colors.text.main : colors.text.light }]}>
            {getSelectedLabel()}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={colors.text.light} />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.main }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.text.lighter }]}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text.main} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text.main }]}>{title}</Text>
              <View style={{ width: 24 }} />
            </View>
            
            {customHeader}
            {renderSearchBar()}
            
            {renderEmptyList() || (
              <FlatList
                data={filteredOptions}
                renderItem={renderOptionItem}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.optionsList}
              />
            )}
            
            {multiSelect && (
              <View style={[styles.actionButtons, { borderTopColor: colors.text.lighter }]}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.gray }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.buttonText, { color: colors.text.main }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: colors.primary.main }]}
                  onPress={confirmSelection}
                >
                  <Text style={[styles.buttonText, { color: colors.text.bright }]}>
                    {t('common.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
  },
  selectorText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 15,
    marginTop: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  optionsList: {
    paddingBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionItemSelected: {
    borderLeftWidth: 4,
    borderLeftColor: ColorsTheme.primary.main,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionItemText: {
    fontSize: 18,
  },
  optionItemTextSelected: {
    fontWeight: 'bold',
  },
  checkmark: {
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default GenericSelector; 