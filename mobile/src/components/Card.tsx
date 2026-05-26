import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useColors, spacing, borderRadius } from '@/lib/theme';

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ style, padding = spacing.md, children, ...props }: CardProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  });
}
