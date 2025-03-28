import { ColorsTheme } from '@/constants/Colors';
import { StyleSheet, TextInput as RNTextInput, TextInputProps } from 'react-native';

export default function TextInput(props: TextInputProps) {
  return (
<RNTextInput 
  {...props} 
  style={Object.assign({}, props.style, styles.input)} 
/>  );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: ColorsTheme.gray,
        color: ColorsTheme.text.main,
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
});