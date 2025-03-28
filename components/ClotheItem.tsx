import { PATTERNS, subtypesByType, types } from "@/constants/Clothes";
import { MATERIALS } from "@/constants/Materials";
import { ClothingItem } from "@/types";
import { router } from "expo-router";
import { TouchableOpacity, Image, View, Text, StyleSheet } from "react-native";

export default function ClotheItem({ item }: { item: ClothingItem }) {
  return (
    <TouchableOpacity 
      style={styles.clothingItem}
      onPress={() => router.push(`/clothing/${item.id}`)}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.clothingImage}
        resizeMode="cover"
      />
      <View style={styles.clothingInfo}>
        <Text style={styles.clothingName}>{item.name}</Text>
        <Text style={styles.clothingBrand}>{item.brand || 'Sans marque'}</Text>
        <View style={styles.tagContainer}>
          <View style={[styles.tag, { backgroundColor: '#FFE0E0' }]}>
            <Text style={styles.tagText}>{types[item.type]}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#E0F0FF' }]}>
            <Text style={styles.tagText}>{subtypesByType[item.type][item.subtype]}</Text>
          </View>
          {item.material && (
            <View style={[styles.tag, { backgroundColor: '#E0FFE0' }]}>
              <Text style={styles.tagText}>{MATERIALS[item.material]}</Text>
            </View>
          )}
          {item.pattern && (
            <View style={[styles.tag, { backgroundColor: '#ede5ff' }]}>
              <Text style={styles.tagText}>{PATTERNS[item.pattern as keyof typeof PATTERNS]}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    clothingItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
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
        color: '#333',
        marginBottom: 4,
      },
      clothingBrand: {
        fontSize: 14,
        color: '#666',
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
        color: '#333',
      },
});

