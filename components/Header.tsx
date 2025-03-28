import { View, Text, StyleSheet } from "react-native";

export default function Header({ title, children }: { title: string, children?: React.ReactNode }) {
  return (
    <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
