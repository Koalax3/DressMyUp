import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Linking, ViewStyle, TextStyle, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
interface ButtonLinkProps {
  url: string;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  otherIcon?: React.ReactNode;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  backgroundColor?: string;
  textColor?: string;
  onPress?: () => void;
  warning?: boolean;
}

const ButtonLink: React.FC<ButtonLinkProps> = ({
  url,
  title,
  icon = 'open-outline',
  otherIcon,
  iconSize = 20,
  iconColor = '#FFFFFF',
  style,
  textStyle,
  backgroundColor = '#007AFF',
  textColor = '#FFFFFF',
  onPress,
  warning = false,
}) => {
  const { t } = useTranslation();
  const handlePress = async () => {
    try {
      if (onPress) {
        onPress();
      }
      if (warning) {
        Alert.alert(title, t('clothing.externalLinkWarning', { url }), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.ok'), onPress: () => Linking.openURL(url) },
        ]);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du lien:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {icon && !otherIcon && (
        <Ionicons 
          name={icon} 
          size={iconSize} 
          color={iconColor} 
          style={styles.icon} 
        />
      )}
      {otherIcon && otherIcon}
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ButtonLink; 