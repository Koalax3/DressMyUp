import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useThemeColor, useRawThemeColor } from '@/hooks/useThemeColor';
import { ColorsTheme } from '@/constants/Colors';

type ColorCategory = keyof typeof ColorsTheme;
type ColorVariant<T extends ColorCategory> = keyof typeof ColorsTheme[T];

export type ThemedViewProps = ViewProps & {
  backgroundColor?: string;
  backgroundColorName?: ColorCategory;
  backgroundVariant?: string;
};

export function ThemedView({ 
  style, 
  backgroundColor,
  backgroundColorName = 'background',
  backgroundVariant = 'main',
  ...otherProps 
}: ThemedViewProps) {
  // Si une couleur spécifique est fournie, elle a la priorité
  const bgColor = backgroundColor || useThemeColor(backgroundColorName as any, backgroundVariant as any);

  return <View style={[{ backgroundColor: bgColor }, style]} {...otherProps} />;
}
