import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  FlatList, 
  ScrollView, 
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClothingItem } from '../types';
import { COLORS } from '@/constants/Clothes';
import { PATTERNS, Pattern } from '@/constants/Clothes';
import { MATERIALS } from '@/constants/Materials';
import ColorDot from './ColorDot';

const { width } = Dimensions.get('window');

// Si vous utilisez un composant ColorDot, importez-le ici
// import ColorDot from './ColorDot';

type ClotheFilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ClotheFilters) => void;
  clothes: ClothingItem[];
  currentFilters: ClotheFilters;
};

export type ClotheFilters = {
  brands: string[];
  colors: string[];
  patterns: string[];
  materials: string[];
};

// Filtres par défaut
const defaultFilters: ClotheFilters = {
  brands: [],
  colors: [],
  patterns: [],
  materials: []
};

const ClotheFilterModal = ({ 
  visible, 
  onClose, 
  onApplyFilters, 
  clothes,
  currentFilters = defaultFilters
}: ClotheFilterModalProps) => {
  // S'assurer que toutes les propriétés sont définies dans les filtres
  const safeCurrentFilters: ClotheFilters = {
    brands: currentFilters?.brands || [],
    colors: currentFilters?.colors || [],
    patterns: currentFilters?.patterns || [],
    materials: currentFilters?.materials || []
  };

  const [filters, setFilters] = useState<ClotheFilters>(safeCurrentFilters);
  const [activeTab, setActiveTab] = useState<'brands' | 'colors' | 'patterns' | 'materials'>('brands');
  
  // Extraire les marques uniques de la garde-robe
  const uniqueBrands = React.useMemo(() => {
    const brands = clothes
      .map(item => item.brand)
      .filter((brand): brand is string => !!brand); // Filtrer les undefined/null
    
    return Array.from(new Set(brands)).sort();
  }, [clothes]);

  // Extraire les motifs uniques de la garde-robe
  const uniquePatterns = React.useMemo(() => {
    const patterns = clothes
      .map(item => item.pattern)
      .filter((pattern): pattern is Pattern => pattern !== null && pattern !== undefined);
    
    return Array.from(new Set(patterns)).sort();
  }, [clothes]);

  // Extraire les matériaux uniques de la garde-robe
  const uniqueMaterials = React.useMemo(() => {
    const materials = clothes
      .map(item => item.material)
      .filter((material): material is string => material !== null && material !== undefined);
    
    return Array.from(new Set(materials)).sort();
  }, [clothes]);

  // Réinitialiser les filtres à leur état initial lorsqu'on ouvre le modal
  useEffect(() => {
    if (visible) {
      // S'assurer que toutes les propriétés sont définies
      const safeCurrent: ClotheFilters = {
        brands: currentFilters?.brands || [],
        colors: currentFilters?.colors || [],
        patterns: currentFilters?.patterns || [],
        materials: currentFilters?.materials || []
      };
      setFilters(safeCurrent);
    }
  }, [visible, currentFilters]);

  const toggleBrand = (brand: string) => {
    setFilters(prev => {
      const brands = prev.brands || [];
      if (brands.includes(brand)) {
        return { ...prev, brands: brands.filter(b => b !== brand) };
      } else {
        return { ...prev, brands: [...brands, brand] };
      }
    });
  };

  const toggleColor = (color: string) => {
    setFilters(prev => {
      const colors = prev.colors || [];
      if (colors.includes(color)) {
        return { ...prev, colors: colors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...colors, color] };
      }
    });
  };

  const togglePattern = (pattern: string) => {
    setFilters(prev => {
      const patterns = prev.patterns || [];
      if (patterns.includes(pattern)) {
        return { ...prev, patterns: patterns.filter(p => p !== pattern) };
      } else {
        return { ...prev, patterns: [...patterns, pattern] };
      }
    });
  };

  const toggleMaterial = (material: string) => {
    setFilters(prev => {
      const materials = prev.materials || [];
      if (materials.includes(material)) {
        return { ...prev, materials: materials.filter(m => m !== material) };
      } else {
        return { ...prev, materials: [...materials, material] };
      }
    });
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  type FilterItemProps = {
    item: string | typeof COLORS[0];
    isSelected: boolean;
    onToggle: () => void;
    type: 'color' | 'brand' | 'pattern' | 'material';
  };

  const FilterItem = ({ item, isSelected, onToggle, type }: FilterItemProps) => {
    // Déterminer le nom à afficher selon le type
    const getDisplayName = (): string => {
      if (type === 'color') {
        return (item as typeof COLORS[0]).name;
      } else if (type === 'pattern') {
        return PATTERNS[item as keyof typeof PATTERNS] || item as string;
      } else if (type === 'material') {
        return MATERIALS[item as string] || item as string;
      }
      return item as string;
    };

    // Styles communs et spécifiques au type
    const containerStyle = [
      type === 'color' ? styles.colorListItem : 
      type === 'brand' ? styles.brandItem : 
      type === 'pattern' ? styles.patternItem : styles.materialItem,
      isSelected && (
        type === 'color' ? styles.colorListItemSelected : 
        type === 'brand' ? styles.brandItemSelected : 
        type === 'pattern' ? styles.patternItemSelected : styles.materialItemSelected
      )
    ];

    const textStyle = [
      type === 'color' ? styles.colorListItemName :
      type === 'brand' ? styles.brandName : 
      type === 'pattern' ? styles.patternName : styles.materialName,
      isSelected && (
        type === 'color' ? styles.colorListItemNameSelected :
        type === 'brand' ? styles.brandNameSelected : 
        type === 'pattern' ? styles.patternNameSelected : styles.materialNameSelected
      )
    ];

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onToggle}
      >
        {type === 'color' ? (
          <View style={styles.colorListItemContent}>
            <ColorDot 
              colorValue={(item as typeof COLORS[0]).value} 
              size={45} 
            />
            <Text style={textStyle}>
              {getDisplayName()}
            </Text>
          </View>
        ) : (
          <Text style={textStyle}>
            {getDisplayName()}
          </Text>
        )}
        
        {isSelected && (
          <Ionicons name="checkmark" size={18} color="#F97A5C" />
        )}
      </TouchableOpacity>
    );
  };

  const renderColorItem = ({ item }: { item: typeof COLORS[0] }) => (
    <FilterItem
      item={item}
      isSelected={filters.colors.includes(item.name)}
      onToggle={() => toggleColor(item.name)}
      type="color"
    />
  );

  const renderBrandItem = ({ item }: { item: string }) => (
    <FilterItem
      item={item}
      isSelected={filters.brands.includes(item)}
      onToggle={() => toggleBrand(item)}
      type="brand"
    />
  );

  const renderPatternItem = ({ item }: { item: string }) => (
    <FilterItem
      item={item}
      isSelected={filters.patterns.includes(item)}
      onToggle={() => togglePattern(item)}
      type="pattern"
    />
  );

  const renderMaterialItem = ({ item }: { item: string }) => (
    <FilterItem
      item={item}
      isSelected={filters.materials.includes(item)}
      onToggle={() => toggleMaterial(item)}
      type="material"
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => onClose()}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onClose()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Filtres</Text>
          <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'brands' && styles.activeTab]} 
            onPress={() => setActiveTab('brands')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'brands' && styles.activeTabText]}
            >
              Marques
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'colors' && styles.activeTab]} 
            onPress={() => setActiveTab('colors')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'colors' && styles.activeTabText]}
            >
              Couleurs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'patterns' && styles.activeTab]} 
            onPress={() => setActiveTab('patterns')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'patterns' && styles.activeTabText]}
            >
              Motifs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'materials' && styles.activeTab]} 
            onPress={() => setActiveTab('materials')}
          >
            <Text 
              style={[styles.tabText, activeTab === 'materials' && styles.activeTabText]}
            >
              Matériaux
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'brands' ? (
          uniqueBrands.length > 0 ? (
            <FlatList
              data={uniqueBrands}
              renderItem={renderBrandItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.brandList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune marque disponible</Text>
            </View>
          )
        ) : activeTab === 'colors' ? (
          <FlatList
            data={COLORS}
            renderItem={renderColorItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.colorList}
          />
        ) : activeTab === 'patterns' ? (
          uniquePatterns.length > 0 ? (
            <FlatList
              data={uniquePatterns}
              renderItem={renderPatternItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.patternList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun motif disponible</Text>
            </View>
          )
        ) : (
          uniqueMaterials.length > 0 ? (
            <FlatList
              data={uniqueMaterials}
              renderItem={renderMaterialItem}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.materialList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun matériau disponible</Text>
            </View>
          )
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>
              Appliquer 
              {((filters.brands && filters.brands.length > 0) || 
                (filters.colors && filters.colors.length > 0) || 
                (filters.patterns && filters.patterns.length > 0) || 
                (filters.materials && filters.materials.length > 0)) && 
                ` (${(filters.brands?.length || 0) + 
                     (filters.colors?.length || 0) + 
                     (filters.patterns?.length || 0) + 
                     (filters.materials?.length || 0)})`
              }
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    padding: 5,
  },
  resetText: {
    fontSize: 14,
    color: '#F97A5C',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#F97A5C',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#F97A5C',
    fontWeight: 'bold',
  },
  brandList: {
    paddingHorizontal: 15,
  },
  colorList: {
    paddingHorizontal: 15,
  },
  patternList: {
    paddingHorizontal: 15,
  },
  materialList: {
    paddingHorizontal: 15,
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  brandItemSelected: {
    backgroundColor: '#FFF5F5',
  },
  brandName: {
    fontSize: 18,
    color: '#333',
  },
  brandNameSelected: {
    color: '#F97A5C',
    fontWeight: 'bold',
  },
  patternItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patternItemSelected: {
    backgroundColor: '#FFF5F5',
  },
  patternName: {
    fontSize: 18,
    color: '#333',
  },
  patternNameSelected: {
    color: '#F97A5C',
    fontWeight: 'bold',
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
    backgroundColor: '#FFF5F5',
  },
  materialName: {
    fontSize: 18,
    color: '#333',
  },
  materialNameSelected: {
    color: '#F97A5C',
    fontWeight: 'bold',
  },
  colorListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  colorListItemSelected: {
    backgroundColor: '#FFF5F5',
  },
  colorListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircleSmall: {
    width: 45,
    height: 45,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  multicolorCircleSmall: {
    width: 45,
    height: 45,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  multiColorSegmentSmall: {
    position: 'absolute',
    width: '50%',
    height: '50%',
  },
  colorListItemName: {
    fontSize: 18,
    color: '#333',
  },
  colorListItemNameSelected: {
    color: '#F97A5C',
    fontWeight: 'bold',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#F97A5C',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
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
    color: '#666',
  },
});

export default ClotheFilterModal; 