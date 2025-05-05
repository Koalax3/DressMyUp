import { ColorsTheme, getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, TextInput as RNTextInput, TextInputProps } from 'react-native';

export default function TextInput(props: TextInputProps) {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const styles = StyleSheet.create({
    input: {
        backgroundColor: colors.gray,
        color: colors.text.main,
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
});
  return (
<RNTextInput 
  {...props} 
  style={Object.assign({}, props.style, styles.input)} 
/>  );
}

