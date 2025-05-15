import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Configuration pour Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  colors: {
    text: {
      main: string;
    };
    primary: {
      main: string;
    };
    border?: string;
    background?: {
      secondary?: string;
    };
  };
  initiallyOpen?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
  titleStyle?: any;
  contentStyle?: any;
}

const Accordion = ({ 
  title,
  children,
  colors,
  initiallyOpen = false,
  icon = "chevron-down",
  style,
  titleStyle,
  contentStyle
}: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [rotateAnimation] = useState(new Animated.Value(initiallyOpen ? 1 : 0));

  const toggleAccordion = () => {
    // Animation de configuration
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Animation de rotation pour l'icône
    Animated.timing(rotateAnimation, {
      toValue: isOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.accordionContainer, style]}>
      <TouchableOpacity 
        style={[
          styles.accordionHeader, 
          colors.border && { borderBottomColor: colors.border, borderBottomWidth: isOpen ? 0 : 1 }
        ]} 
        onPress={toggleAccordion}
        activeOpacity={0.7}
      >
        <Text style={[styles.accordionTitle, { color: colors.text.main }, titleStyle]}>
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={colors.primary.main} 
          />
        </Animated.View>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={[
          styles.accordionContent, 
          colors.background?.secondary && { backgroundColor: colors.background.secondary },
          contentStyle
        ]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  accordionContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  accordionContent: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
});

export default Accordion; 