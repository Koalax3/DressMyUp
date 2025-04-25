import { PATTERNS, subtypesByType, types } from "@/constants/Clothes";
import { MATERIALS } from "@/constants/Materials";
import { ClothingItem } from "@/types";
import { router } from "expo-router";
import { TouchableOpacity, Image, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getThemeColors } from "@/constants/Colors";

export default function ClotheItem({ item }: { item: ClothingItem }) {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const tag = (color: string, text: string) => (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={[styles.tagText, { color: colors.black }]}>{text}</Text>
    </View>
  )
  return (
    <TouchableOpacity 
      style={[styles.clothingItem, { backgroundColor: colors.gray }]}
      onPress={() => router.push(`/clothing/${item.id}`)}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.clothingImage}
        resizeMode="cover"
      />
      <View style={styles.clothingInfo}>
        <Text style={[styles.clothingName, { color: colors.text.main }]}>{item.name}</Text>
        <Text style={[styles.clothingBrand, { color: colors.text.light }]}>{item.brand || 'Sans marque'} {item.reference && `- ${item.reference}`}</Text>
        <View style={styles.tagContainer}>
          {tag(colors.tag.red, types[item.type])}
          {item.subtype && tag(colors.tag.blue, subtypesByType[item.type][item.subtype]!)}
          {item.material && tag(colors.tag.green, MATERIALS[item.material])}
          {item.pattern && tag(colors.tag.purple, PATTERNS[item.pattern as keyof typeof PATTERNS])}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    clothingItem: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 15,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      clothingImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
      },
      clothingInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
      },
      clothingName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
      },
      clothingBrand: {
        fontSize: 14,
        marginBottom: 8,
      },
      tagContainer: {
        flexDirection: 'row',
      },
      tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 6,
      },
      tagText: {
        fontSize: 12,
      },
});

