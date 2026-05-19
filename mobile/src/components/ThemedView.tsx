import React from 'react';
import { View, ViewProps } from 'react-native';
import { colors } from '@/lib/theme';

interface ThemedViewProps extends ViewProps {
  variant?: 'surface' | 'background' | 'transparent';
}

export function ThemedView({ style, variant = 'background', ...props }: ThemedViewProps) {
  const bgColor = variant === 'surface' ? colors.surface : variant === 'transparent' ? 'transparent' : colors.background;
  return <View style={[{ backgroundColor: bgColor, flex: 1 }, style]} {...props} />;
}
