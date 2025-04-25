import { ColorsTheme } from "@/constants/Colors";
import { ActivityIndicator, View } from "react-native";

export default function LoadingView() {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', transform: [{ scale: 1.5 }] }}>
        <ActivityIndicator size="large" color={ColorsTheme.primary.main} />
    </View>;
}