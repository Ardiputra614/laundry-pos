import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing } from '@/lib/theme';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'file-tray-outline', title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.gray300} />
      <ThemedText variant="heading" style={styles.title}>{title}</ThemedText>
      {description && (
        <ThemedText variant="body" color={colors.textSecondary} style={styles.description}>
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  button: {
    marginTop: spacing.lg,
  },
});
