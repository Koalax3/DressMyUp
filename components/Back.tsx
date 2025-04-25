import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getThemeColors } from "@/constants/Colors";

export default function Back() {
    const router = useRouter();
    const { isDarkMode } = useTheme();
    const colors = getThemeColors(isDarkMode);
    const moveBack = () => {
        if (router.canGoBack()) {
            router.back()
        } else {
            router.replace('/')
        }
    }
    return <TouchableOpacity onPress={() => moveBack()}><Ionicons name="arrow-back" size={24} color={colors.text.main} /></TouchableOpacity>
}
