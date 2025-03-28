import { ColorsTheme } from "@/constants/Colors";
import { View, Text } from "react-native";
 
export default function HomeScreen() {
  return (
    <View style={{ backgroundColor: ColorsTheme.white, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home</Text>
    </View>
  );
}
