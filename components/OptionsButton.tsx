import { ColorsTheme, getThemeColors } from "@/constants/Colors";
import { useFilter } from "@/contexts/FilterContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

export default function OptionsButton({ openFilterModal, filterType }: { openFilterModal: () => void, filterType: 'clothes' | 'outfit' }) {
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);
    const {  getClothesFilterCount, getOutfitFilterCount } = useFilter();
    const filterCount = filterType === 'clothes' ? getClothesFilterCount() : getOutfitFilterCount();
    return (
        <TouchableOpacity 
            style={[styles.filterIconButton, { 
              backgroundColor: colors.background.main,
              borderColor: colors.primary.main 
            }]}
            onPress={openFilterModal}
          >
            <Ionicons name="options-outline" size={24} color={colors.primary.main} />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    filterIconButton: {
        position: 'relative',
        marginLeft: 10,
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      filterBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: ColorsTheme.primary.main,
      },
      filterBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: ColorsTheme.background.main
      },
})