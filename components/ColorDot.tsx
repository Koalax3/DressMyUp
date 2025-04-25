import { getThemeColors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import { View, StyleSheet, Image } from "react-native";

export default function ColorDot({ colorValue, size = 24 }: { colorValue: string, size?: number }) {
  const { isDarkMode } = useTheme();
  const colors = getThemeColors(isDarkMode);
  const styles = StyleSheet.create({
    colorCircle: {
      width: size,
      height: size,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: colors.gray,
      marginRight: 10,    
    },
    multicolorCircle: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 9999,
    },
    multiColorSegment: {
      position: 'absolute',
      width: '50%',
      height: '50%',
      borderRadius: 9999,
    },
  
  });

  return (
    <View 
          style={[
            styles.colorCircle, 
            { 
              backgroundColor: colorValue === 'linear-gradient' 
                ? 'transparent' 
                : colorValue,
            }
          ]}
        >
          {colorValue === 'linear-gradient' && (
            <Image source={require('../assets/images/multi-color.jpg')} style={styles.multicolorCircle} />
          )}
        </View>
  );
}

