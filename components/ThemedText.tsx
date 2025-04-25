import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ColorsTheme } from '@/constants/Colors';

type ColorCategory = keyof typeof ColorsTheme;
type ColorVariant<T extends ColorCategory> = keyof typeof ColorsTheme[T];

export type ThemedTextProps = TextProps & {
  textColor?: string;
  textColorName?: ColorCategory;
  textColorVariant?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  textColor,
  textColorName = 'text',
  textColorVariant = 'main',
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = textColor || useThemeColor(textColorName as any, textColorVariant as any);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
