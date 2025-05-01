import React from 'react';
import { StyleSheet, View } from 'react-native';
import GenericSelector from './GenericSelector';
import { MATERIALS } from '@/constants/Materials';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';

type MaterialSelectorProps = {
  selectedMaterial: string | null;
  onMaterialSelect: (material: string | null) => void;
};

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  selectedMaterial,
  onMaterialSelect
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);

  const handleMaterialSelect = (option: string | string[]) => {
    if (typeof option === 'string') {
      onMaterialSelect(option);
    } else if (Array.isArray(option) && option.length > 0) {
      onMaterialSelect(option[0]);
    } else {
      onMaterialSelect(null);
    }
  };

  // Convertir MATERIALS en format compatible avec GenericSelector
  const materialOptions = Object.entries(MATERIALS).map(([key, label]) => ({
    key,
    label
  }));

  return (
    <View style={styles.container}>
      <GenericSelector
        options={materialOptions}
        selectedOption={selectedMaterial}
        onOptionSelect={handleMaterialSelect}
        title="Sélectionner un matériau"
        placeholder="Sélectionner un matériau"
        multiSelect={false}
        searchable={true}
        searchPlaceholder="Rechercher un matériau..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
  },
});

export default MaterialSelector; 