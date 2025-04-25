import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

type ButtonProps = {
  title?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  rounded?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const Button: React.FC<ButtonProps> = ({
  title = '',
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  variant = 'primary',
  rounded = false,
  icon,
}) => {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const styles = StyleSheet.create({
    button: {
      borderRadius: rounded ? 100 : 8,
      paddingVertical: 12,
      paddingHorizontal: icon && !title ? 12 : 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.button, { backgroundColor: colors.secondary.main }, style];
      case 'outline':
        return [
          styles.button, 
          { 
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary.main
          }, 
          style
        ];
      case 'primary':
      default:
        return [styles.button, { backgroundColor: colors.primary.main }, style];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return [styles.text, { color: colors.primary.main }, textStyle];
      case 'primary':
      case 'secondary':
      default:
        return [styles.text, { color: colors.white }, textStyle];
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary.main : colors.white} />
      ) : (
        title && <Text style={getTextStyle()}>{title}</Text>
      )}
      {icon && <Ionicons name={icon} size={24} color={variant === 'outline' ? colors.primary.main : colors.white} />}
    </TouchableOpacity>
  );
};



export default Button;
