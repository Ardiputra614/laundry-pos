import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useNetworkStatus } from '@/lib/network';
import { useColors, spacing, borderRadius } from '@/lib/theme';

export function NetworkIndicator() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const colors = useColors();
  const isOnline = isConnected && isInternetReachable;

  return (
    <View style={[styles.badge, { backgroundColor: isOnline ? '#16A34A' : '#DC2626' }]}>
      <View style={[styles.dot, { backgroundColor: colors.white }]} />
      <ThemedText variant="caption" color={colors.white} style={styles.text}>
        {isOnline ? 'Online' : 'Offline'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
  },
});
