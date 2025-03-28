import { View, StyleSheet } from "react-native";

export default function ColorDot({ colorValue, size = 24 }: { colorValue: string, size?: number }) {
  
  const styles = StyleSheet.create({
    colorCircle: {
      width: size,
      height: size,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: '#ddd',
      marginRight: 10,    
    },
    multicolorCircle: {
      position: 'absolute',
      width: '100%',
      height: '100%',
    },
    multiColorSegment: {
      position: 'absolute',
      width: '50%',
      height: '50%',
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
            <View style={styles.multicolorCircle}>
              <View style={[styles.multiColorSegment, { backgroundColor: '#FF0000', top: 0, left: 0 }]} />
              <View style={[styles.multiColorSegment, { backgroundColor: '#00FF00', top: 0, right: 0 }]} />
              <View style={[styles.multiColorSegment, { backgroundColor: '#0000FF', bottom: 0, left: 0 }]} />
              <View style={[styles.multiColorSegment, { backgroundColor: '#FFFF00', bottom: 0, right: 0 }]} />
            </View>
          )}
        </View>
  );
}

