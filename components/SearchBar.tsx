import { ColorsTheme } from "@/constants/Colors";

import { useTheme } from "@/contexts/ThemeContext";
import { getThemeColors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, StyleSheet, TextInput } from "react-native";

export const SearchBar = ({ searchText, setSearchText }: { searchText: string, setSearchText: (text: string) => void }) => {
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);
    return (
        <View style={[styles.searchBar, { backgroundColor: colors.gray }]}>
        <Ionicons name="search" size={20} color={colors.text.light} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.main }]}
          placeholder="Rechercher..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={colors.text.light}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.light} />
          </TouchableOpacity>
        )}
      </View>
    )
}

const styles = StyleSheet.create({
     searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ColorsTheme.gray,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
    color: ColorsTheme.primary.main,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ColorsTheme.text.main,
  },
})

export default SearchBar;
