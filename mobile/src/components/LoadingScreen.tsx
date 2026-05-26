import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '@/lib/theme';
import { ThemedText } from './ThemedText';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText variant="body" color={colors.textSecondary} style={styles.text}>
        {message}
      </ThemedText>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    text: {
      marginTop: 16,
    },
  });
}
