import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LargeButton({ title, onPress, icon, color }: { title: string, onPress: () => void, icon?: React.ComponentProps<typeof Ionicons>['name'], color?: string }) {
  return (
    <TouchableOpacity 
              style={styles.button}
              onPress={onPress}
            >
              <Ionicons name={icon} size={20} color={color} />
              <Text style={styles.buttonText}>{title}</Text>
            </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97A5C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

