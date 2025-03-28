import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors, { ColorsTheme } from '@/constants/Colors';

interface PublicSwitchProps {
  isPublic: boolean;
  onToggle: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const PublicSwitch: React.FC<PublicSwitchProps> = ({ 
  isPublic, 
  onToggle, 
  label = "Rendre public",
  disabled = false
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Ionicons 
          name={isPublic ? "eye-outline" : "eye-off-outline"} 
          size={20} 
          color={disabled ? "#999" : "#555"} 
          style={styles.icon}
        />
        <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
      </View>
      <Switch
        value={isPublic}
        onValueChange={onToggle}
        trackColor={{ false: ColorsTheme.gray, true: ColorsTheme.primary.main }}
        thumbColor={isPublic ? ColorsTheme.primary.main : ColorsTheme.primary.light}
        ios_backgroundColor="#d9d9d9"
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