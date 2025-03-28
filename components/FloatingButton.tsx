import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Animated, ViewStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScroll } from '../contexts/ScrollContext';

type FloatingButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  iconColor?: string;
  backgroundColor?: string;
  scrollRef?: React.RefObject<Animated.FlatList<any>>;
};

const FloatingButton = ({ 
  iconName, 
  label, 
  onPress, 
  style,
  iconColor = '#FFF',
  backgroundColor = '#F97A5C',
  scrollRef
}: FloatingButtonProps) => {
  // Utiliser le contexte de défilement
  const { setScrollPosition, isScrolled } = useScroll();
  
  // Animation pour le texte
  const labelWidth = React.useRef(new Animated.Value(80)).current;
  const labelOpacity = React.useRef(new Animated.Value(1)).current;
  const buttonWidth = React.useRef(new Animated.Value(130)).current; // Largeur initiale du bouton
  const buttonHeight = React.useRef(new Animated.Value(48)).current; // Hauteur initiale du bouton
  const borderRadius = React.useRef(new Animated.Value(24)).current; // Rayon de bordure initial
  const scale = React.useRef(new Animated.Value(1)).current; // Scale pour feedback tactile

  // Réagir au changement d'état isScrolled
  useEffect(() => {
    if (isScrolled) {
      // Si on a défilé, cacher le texte et rendre le bouton rond
      Animated.parallel([
        Animated.timing(labelWidth, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // Ne peut pas être native pour width
        }),
        Animated.timing(labelOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // Pour synchroniser avec les autres animations
        }),
        Animated.timing(buttonWidth, {
          toValue: 48,
          duration: 200,
          useNativeDriver: false, // Ne peut pas être native pour width
        }),
        Animated.timing(buttonHeight, {
          toValue: 48,
          duration: 200,
          useNativeDriver: false, // Ne peut pas être native pour height
        }),
        Animated.timing(borderRadius, {
          toValue: 24,
          duration: 200,
          useNativeDriver: false, // Ne peut pas être native pour borderRadius
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: false, // Pour synchroniser avec les autres animations
        })
      ]).start();
    } else {
      // Sinon, montrer le texte et allonger le bouton
      Animated.parallel([
        Animated.timing(labelWidth, {
          toValue: 80,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(buttonWidth, {
          toValue: 130,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(buttonHeight, {
          toValue: 48,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(borderRadius, {
          toValue: 24,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [isScrolled, labelWidth, labelOpacity, buttonWidth, buttonHeight, borderRadius, scale]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: false,
      friction: 5
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: false,
      friction: 5
    }).start();
  };

  const handleLongPress = () => {
    // Revenir au début de la liste
    if (scrollRef?.current) {
      scrollRef.current.scrollToOffset({ offset: 0, animated: true });
    } else {
      // Alternative: utiliser le context pour modifier directement la position
      setScrollPosition(0);
    }
  };

  return (
    <Animated.View
      style={[
        styles.button,
        {
          width: buttonWidth,
          height: buttonHeight,
          borderRadius: borderRadius,
          backgroundColor,
          transform: [{ scale }]
        },
        style
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        delayLongPress={500}
      >
        <View style={styles.buttonContent}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          <Animated.View 
            style={{
              width: labelWidth,
              opacity: labelOpacity,
              overflow: 'hidden',
            }}
          >
            <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 9999,
    overflow: 'hidden',
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  label: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default FloatingButton; 