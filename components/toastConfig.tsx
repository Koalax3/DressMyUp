import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '@/contexts/ThemeContext';
interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
}

const toastConfig = {
  error: ({ text1, text2 }: CustomToastProps) => {
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);
    
    return (
      <View style={{...styles.toastContainer, backgroundColor: colors.background.main, borderColor: colors.similar.darker}}>
        <Ionicons name="close-circle" size={32} color={colors.similar.darker} />
        {text1 && (
          <Text style={{...styles.toastText, color: colors.text.main}}>
            {text1}
          </Text>
        )}
        {text2 && <Text style={{...styles.secondaryText, color: colors.text.light}}>{text2}</Text>}
      </View>
    );
  },
  success: ({ text1, text2 }: CustomToastProps) => {
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);
    return (
      <View style={{...styles.toastContainer, backgroundColor: colors.background.main, borderColor: colors.primary.main}}>
        <Ionicons name="checkmark-circle" size={32} color={colors.primary.main} />
        {text1 && (
          <Text style={{...styles.toastText, color: colors.text.main}}>
            {text1}
          </Text>
        )}
        {text2 && <Text style={{...styles.secondaryText, color: colors.text.light}}>{text2}</Text>}
      </View>
    )
  },
  delete: ({ text1, text2 }: CustomToastProps) => {
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);
    
    return (
      <View style={{...styles.toastContainer, backgroundColor: colors.background.main, borderColor: colors.similar.main}}>
        <Ionicons name="trash" size={32} color={colors.similar.main} />
        {text1 && (
          <Text style={{...styles.toastText, color: colors.text.main}}>
            {text1}
          </Text>
        )}
        {text2 && <Text style={{...styles.secondaryText, color: colors.text.light}}>{text2}</Text>}
      </View>
    );
  },
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '90%',
    minHeight: 52,
    borderWidth: 2,
    padding: 20,
    borderRadius: 8,
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  secondaryText: {
    fontSize: 12,
    marginLeft: 8,
  }
});

export default toastConfig;