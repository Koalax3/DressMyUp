import { View, Text, StyleSheet } from "react-native";
import Back from "./Back";
import { useTheme } from "@/contexts/ThemeContext";
import { getThemeColors } from "@/constants/Colors";

export default function Header({ title, children, back = false }: { title: string, children?: React.ReactNode, back?: boolean }) {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const styles = StyleSheet.create({
    header: {
      position: 'relative',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 75,
    },
    title: {
      position: back ? 'absolute' : 'relative',
      left: back ? '50%' : 'auto',
      right: back ? '50%' : 'auto',
      width: back ? '50%' : 'auto',
      transform: [{ translateX: back ? '-50%' : 0 }],
      textAlign: 'center',
      fontSize: back ? 20 : 24,
      fontWeight: 'bold',
      color: colors.text.main,
    },
  });
  return (
    <View style={styles.header}>
        {back && <Back />}
        <Text style={styles.title}>{title}</Text>
        {back && <View style={{ width: 24 }} />}
        {!children && back && <View style={{ width: 24 }} />}
        {children}
      </View>
  );
}


