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
  SafeAreaView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClothingItem } from '../types';
import { COLORS, ColorType } from '@/constants/Clothes';
import { PATTERNS, Pattern } from '@/constants/Clothes';
import { MATERIALS } from '@/constants/Materials';
import ColorDot from './ColorDot';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import StripedElement from './StripedElement';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/i18n/useTranslation';

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
  colorFilterMode?: 'sameItem' | 'differentItems';
};

// Filtres par défaut
const defaultFilters: ClotheFilters = {
  brands: [],
  colors: [],
  patterns: [],
  materials: [],
  colorFilterMode: 'differentItems'
};

const ClotheFilterModal = ({ 
  visible, 
  onClose, 
  onApplyFilters, 
  clothes,
  currentFilters = defaultFilters
}: ClotheFilterModalProps) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  // S'assurer que toutes les propriétés sont définies dans les filtres
  const safeCurrentFilters: ClotheFilters = {
    brands: currentFilters?.brands || [],
    colors: currentFilters?.colors || [],
    patterns: currentFilters?.patterns || [],
    materials: currentFilters?.materials || [],
    colorFilterMode: currentFilters?.colorFilterMode || 'differentItems'
  };

  const [localFilters, setLocalFilters] = useState<ClotheFilters>(safeCurrentFilters);
  const [activeTab, setActiveTab] = useState<'brands' | 'colors' | 'patterns' | 'materials'>('brands');
  const [colorFilterMode, setColorFilterMode] = useState<'sameItem' | 'differentItems'>(
    safeCurrentFilters.colorFilterMode || 'differentItems'
  );
  
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
        materials: currentFilters?.materials || [],
        colorFilterMode: currentFilters?.colorFilterMode || 'differentItems'
      };
      setLocalFilters(safeCurrent);
      setColorFilterMode(safeCurrent.colorFilterMode || 'differentItems');
    }
  }, [visible, currentFilters]);

  const toggleBrand = (brand: string) => {
    setLocalFilters(prev => {
      const brands = prev.brands || [];
      if (brands.includes(brand)) {
        return { ...prev, brands: brands.filter(b => b !== brand) };
      } else {
        return { ...prev, brands: [...brands, brand] };
      }
    });
  };

  const toggleColor = (color: string) => {
    setLocalFilters(prev => {
      const colors = prev.colors || [];
      if (colors.includes(color)) {
        return { ...prev, colors: colors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...colors, color] };
      }
    });
  };

  const togglePattern = (pattern: string) => {
    setLocalFilters(prev => {
      const patterns = prev.patterns || [];
      if (patterns.includes(pattern)) {
        return { ...prev, patterns: patterns.filter(p => p !== pattern) };
      } else {
        return { ...prev, patterns: [...patterns, pattern] };
      }
    });
  };

  const toggleMaterial = (material: string) => {
    setLocalFilters(prev => {
      const materials = prev.materials || [];
      if (materials.includes(material)) {
        return { ...prev, materials: materials.filter(m => m !== material) };
      } else {
        return { ...prev, materials: [...materials, material] };
      }
    });
  };

  // Fonction pour changer le mode de filtrage des couleurs
  const toggleColorFilterMode = () => {
    setColorFilterMode(prev => prev === 'sameItem' ? 'differentItems' : 'sameItem');
  };

  const applyFilters = (empty = false) => {
    if (empty) {
      onApplyFilters({
        ...defaultFilters,
        colorFilterMode
      });
    } else {
      onApplyFilters({
        ...localFilters,
        colorFilterMode
      });
    }
    onClose();
  };

  const resetFilters = () => {
    setLocalFilters(defaultFilters);
    setColorFilterMode('differentItems');
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
        const colorItem = item as ColorType;
        return t(`clothingColors.${colorItem.id}`);
      } else if (type === 'pattern') {
        return t(`clothingPatterns.${item as string}`) || item as string;
      } else if (type === 'material') {
        return t(`clothingMaterials.${item as string}`) || item as string;
      }
      return item as string;
    };

    // Styles communs et spécifiques au type
    const containerStyle = [
      type === 'color' ? styles.colorListItem : 
      type === 'brand' ? styles.brandItem : 
      type === 'pattern' ? styles.patternItem : styles.materialItem,
      { borderBottomColor: colors.text.lighter },
      isSelected && (
        type === 'color' ? [styles.colorListItemSelected, { backgroundColor: colors.gray }] : 
        type === 'brand' ? [styles.brandItemSelected, { backgroundColor: colors.gray }] : 
        type === 'pattern' ? [styles.patternItemSelected, { backgroundColor: colors.gray }] : 
        [styles.materialItemSelected, { backgroundColor: colors.gray }]
      )
    ];

    const textStyle = [
      type === 'color' ? styles.colorListItemName :
      type === 'brand' ? styles.brandName : 
      type === 'pattern' ? styles.patternName : styles.materialName,
      { color: colors.text.main },
      isSelected && (
        type === 'color' ? [styles.colorListItemNameSelected, { color: colors.primary.main }] :
        type === 'brand' ? [styles.brandNameSelected, { color: colors.primary.main }] : 
        type === 'pattern' ? [styles.patternNameSelected, { color: colors.primary.main }] : 
        [styles.materialNameSelected, { color: colors.primary.main }]
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
          <Ionicons name="checkmark" size={18} color={colors.primary.main} />
        )}
      </TouchableOpacity>
    );
  };

  const renderColorItem = ({ item }: { item: typeof COLORS[0] }) => (
    <FilterItem
      item={item}
      isSelected={localFilters.colors.includes(item.id)}
      onToggle={() => toggleColor(item.id)}
      type="color"
    />
  );

  const renderBrandItem = ({ item }: { item: string }) => (
    <FilterItem
      item={item}
      isSelected={localFilters.brands.includes(item)}
      onToggle={() => toggleBrand(item)}
      type="brand"
    />
  );

  const renderPatternItem = ({ item }: { item: string }) => (
    <FilterItem
      item={item}
      isSelected={localFilters.patterns.includes(item)}
      onToggle={() => togglePattern(item)}
      type="pattern"
    />
  );

  const renderMaterialItem = ({ item }: { item: string }) => (
    <FilterItem
      item={item}
      isSelected={localFilters.materials.includes(item)}
      onToggle={() => toggleMaterial(item)}
      type="material"
    />
  );

  // Fonction pour récupérer les couleurs sélectionnées sous forme de tableau
  const getMultiColorArray = () => {
    // Si aucune couleur n'est sélectionnée, utiliser les couleurs par défaut
    if (localFilters.colors.length === 0) {
      return [ColorsTheme.primary.main, ColorsTheme.secondary.main];
    }
    
    // Récupérer les couleurs sélectionnées
    return localFilters.colors.map(colorId => {
      const colorObj = COLORS.find(c => c.id === colorId);
      return colorObj ? colorObj.value : ColorsTheme.primary.main;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => onClose()}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
        <View style={[styles.header, { 
          borderBottomColor: colors.text.lighter,
          backgroundColor: colors.background.main 
        }]}>
          <TouchableOpacity onPress={() => onClose()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.main} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.main }]}>{t('clothing.filters')}</Text>
          <View style={{width: 24}}></View>
        </View>

        <View style={[styles.tabs, { borderBottomColor: colors.text.lighter }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'brands' && [styles.activeTab, { borderBottomColor: colors.primary.main }]]} 
            onPress={() => setActiveTab('brands')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: colors.text.light },
                activeTab === 'brands' && [styles.activeTabText, { color: colors.primary.main }]
              ]}
            >
              {t('clothing.brands')}
              {localFilters.brands.length > 0 && ` (${localFilters.brands.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'colors' && [styles.activeTab, { borderBottomColor: colors.primary.main }]]} 
            onPress={() => setActiveTab('colors')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: colors.text.light },
                activeTab === 'colors' && [styles.activeTabText, { color: colors.primary.main }]
              ]}
            >
              {t('clothing.colors')}
              {localFilters.colors.length > 0 && ` (${localFilters.colors.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'patterns' && [styles.activeTab, { borderBottomColor: colors.primary.main }]]} 
            onPress={() => setActiveTab('patterns')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: colors.text.light },
                activeTab === 'patterns' && [styles.activeTabText, { color: colors.primary.main }]
              ]}
            >
              {t('clothing.patterns')}
              {localFilters.patterns.length > 0 && ` (${localFilters.patterns.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'materials' && [styles.activeTab, { borderBottomColor: colors.primary.main }]]} 
            onPress={() => setActiveTab('materials')}
          >
            <Text 
              style={[
                styles.tabText, 
                { color: colors.text.light },
                activeTab === 'materials' && [styles.activeTabText, { color: colors.primary.main }]
              ]}
            >
              {t('clothing.materials')}
              {localFilters.materials.length > 0 && ` (${localFilters.materials.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[{flex: 1}, { backgroundColor: colors.background.main }]}>
          {activeTab === 'brands' ? (
            <>
              {uniqueBrands.length > 0 ? (
                <FlatList
                  data={uniqueBrands}
                  renderItem={renderBrandItem}
                  keyExtractor={(item) => item}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text.light }]}>{t('clothing.noBrandsAvailable')}</Text>
                </View>
              )}
            </>
          ) : null}

          {activeTab === 'colors' ? (
            <>              
              <FlatList
                data={COLORS}
                renderItem={renderColorItem}
                keyExtractor={(item) => item.id}
              />
            </>
          ) : null}

          {activeTab === 'patterns' ? (
            <>
              {uniquePatterns.length > 0 ? (
                <FlatList
                  data={uniquePatterns}
                  renderItem={renderPatternItem}
                  keyExtractor={(item) => item}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text.light }]}>{t('clothing.noPatternsAvailable')}</Text>
                </View>
              )}
            </>
          ) : null}

          {activeTab === 'materials' ? (
            <>
              {uniqueMaterials.length > 0 ? (
                <FlatList
                  data={uniqueMaterials}
                  renderItem={renderMaterialItem}
                  keyExtractor={(item) => item}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.text.light }]}>{t('clothing.noMaterialsAvailable')}</Text>
                </View>
              )}
            </>
          ) : null}
        </View>

        <View style={[styles.footer, { 
          borderTopColor: colors.text.lighter,
          backgroundColor: colors.background.main 
        }]}>
          {/* Option pour le mode de filtrage des couleurs */}
          {localFilters.colors.length > 1 && (
            <View style={styles.colorFilterModeContainer}>
              <View style={styles.colorFilterModeOptions}>
                <Ionicons name="shirt" size={24} color={colors.primary.main} />
                <Ionicons name="shirt" size={24} color={colors.secondary.main} />
                <Switch
                  value={colorFilterMode === 'sameItem'}
                  onValueChange={toggleColorFilterMode}
                  trackColor={{ false: colors.primary.light, true: colors.secondary.lighter }}
                  thumbColor={colorFilterMode === 'sameItem' ? colors.secondary.main : colors.primary.main}
                  ios_backgroundColor={colors.text.light}
                  style={{ marginHorizontal: 10 }}
                />
                <StripedElement
                  maskElement={<Ionicons name="shirt" size={24}/>}
                  colors={[colors.primary.main, colors.secondary.main]}
                  stripeCount={8}
                  orientation={'horizontal'}
                  width={26}
                  height={26}
                />
              </View>
              <Text style={[styles.colorFilterModeDescription, { color: colors.text.light }]}>
                {colorFilterMode === 'sameItem' 
                  ? t('clothing.clothingWithAllColors') 
                  : t('clothing.clothingWithAnyColor')}
              </Text>
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.resetFiltersButton, { backgroundColor: colors.secondary.main }]}
              onPress={resetFilters}
            >
              <Text style={[styles.resetFiltersButtonText]}>{t('common.reset')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: colors.primary.main }]}
              onPress={() => applyFilters()}
            >
              <Text style={[styles.applyButtonText, { color: colors.text.bright }]}>{t('common.apply')}</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  resetFiltersButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetFiltersButtonText: {
    color: ColorsTheme.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#F97A5C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  colorFilterModeContainer: {
  },
  colorFilterModeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  colorFilterModeOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorFilterModeOption: {
    fontSize: 14,
    color: '#666',
  },
  colorFilterModeOptionActive: {
    fontSize: 14,
    color: '#F97A5C',
    fontWeight: 'bold',
  },
  colorFilterModeDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 15,
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
    paddingHorizontal: 15,
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
    paddingHorizontal: 15,
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
    paddingHorizontal: 15,
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
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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