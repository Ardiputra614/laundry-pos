import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColors, fontSize } from '@/lib/theme';

interface ThemedTextProps extends TextProps {
  variant?: 'hero' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
}

export function ThemedText({ style, variant = 'body', weight = 'regular', color, ...props }: ThemedTextProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        weight !== 'regular' && { fontWeight: weight === 'bold' ? '700' : weight === 'semibold' ? '600' : '500' },
        color && { color },
        style,
      ]}
      {...props}
    />
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    base: {
      color: colors.text,
    },
    hero: {
      fontSize: fontSize.hero,
      fontWeight: '700',
      lineHeight: 40,
    },
    title: {
      fontSize: fontSize.title,
      fontWeight: '700',
      lineHeight: 36,
    },
    heading: {
      fontSize: fontSize.xl,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: fontSize.md,
      lineHeight: 24,
    },
    caption: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.textSecondary,
    },
  });
}
