import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function Button({ title, onPress, icon, type = 'primary' }: { title?: string, onPress?: () => void, icon?: React.ComponentProps<typeof Ionicons>['name'], type?: 'primary' | 'secondary' }) {
  return (
    <TouchableOpacity 
    style={[styles.addButton, type === 'primary' && styles.primaryButton, type === 'secondary' && styles.secondaryButton]}
    onPress={onPress}
  >
    {icon && <Ionicons name={icon} size={24} color={type === 'primary' ? '#fff' : '#F97A5C'} />}
    {title && <Text style={styles.title}>{title}</Text>}
  </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#F97A5C',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#F97A5C',
  },
  secondaryButton: {
    backgroundColor: '#fff',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
