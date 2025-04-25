import React from 'react';
import { StyleSheet, View, Text, Switch, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface PublicSwitchProps {
  isPublic: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PublicSwitch: React.FC<PublicSwitchProps> = ({ 
  isPublic, 
  onToggle, 
  label = "Rendre public",
  disabled = false,
  style = {}
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Ionicons 
          name={isPublic ? "eye-outline" : "eye-off-outline"} 
          size={20} 
          color={colors.text.main} 
          style={styles.icon}
        />
        <Text style={{...styles.label, color: colors.text.main}}>{label}</Text>
      </View>
      <Switch
        value={isPublic}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray, true: colors.primary.main }}
        thumbColor={isPublic ? colors.primary.main : colors.primary.light}
        ios_backgroundColor={colors.gray}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  disabledLabel: {
    color: '#999',
  },
  icon: {
    marginRight: 8,
  }
});

export default PublicSwitch; 