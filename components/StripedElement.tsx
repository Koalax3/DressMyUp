import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type StripedElementProps = {
    maskElement: React.ReactElement;
    colors: string[];
    stripeCount?: number;
    width?: number; 
    height?: number;
    style?: StyleProp<ViewStyle>;
    orientation?: 'vertical' | 'horizontal';
};

const StripedElement = ({
    maskElement,
    colors,
    stripeCount = 8,
    width = 24,
    height = 24,
    style,
    orientation = 'vertical',
  }: StripedElementProps) => {
    // Si un tableau de couleurs est fourni, l'utiliser. Sinon, utiliser color1 et color2

    // Générer les rayures avec des transitions nettes
    const renderStripes = () => {
      const stripes = [];
      
      if (orientation === 'vertical') {
        // Rayures verticales
        const stripeWidth = width / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
          const colorIndex = i % colors.length;
          stripes.push(
            <View
              key={i}
              style={{
                position: 'absolute',
                left: i * stripeWidth,
                width: stripeWidth,
                height: height,
                backgroundColor: colors[colorIndex],
              }}
            />
          );
        }
      } else {
        // Rayures horizontales
        const stripeHeight = height / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
          const colorIndex = i % colors.length;
          stripes.push(
            <View
              key={i}
              style={{
                position: 'absolute',
                top: i * stripeHeight,
                width: width,
                height: stripeHeight+1,
                backgroundColor: colors[colorIndex],
              }}
            />
          );
        }
      }
      
      return stripes;
    };

    return (
      <MaskedView
        style={[styles.container, { width, height }, style]}
        maskElement={maskElement}
      >
        <View style={{ width, height }}>
          {renderStripes()}
        </View>
      </MaskedView>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      overflow: 'hidden',
      borderColor: 'red',
    },
  });
  
  export default StripedElement;