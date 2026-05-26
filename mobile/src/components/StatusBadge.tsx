import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, borderRadius, fontSize, spacing } from '@/lib/theme';
import { OrderStatus, PaymentStatus } from '@/types';
import { useI18nStore } from '@/stores/i18nStore';
import { tStatus } from '@/lib/i18n';

type StatusType = OrderStatus | PaymentStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  type?: 'order' | 'payment' | 'subscription' | 'general';
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  washing: { bg: '#DBEAFE', text: '#2563EB' },
  drying: { bg: '#E0E7FF', text: '#4F46E5' },
  ironing: { bg: '#F3E8FF', text: '#9333EA' },
  packing: { bg: '#D1FAE5', text: '#059669' },
  finished: { bg: '#D1FAE5', text: '#059669' },
  ready: { bg: '#D1FAE5', text: '#059669' },
  delivered: { bg: '#DBEAFE', text: '#2563EB' },
  completed: { bg: '#D1FAE5', text: '#059669' },
  processing: { bg: '#DBEAFE', text: '#2563EB' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  unpaid: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#D1FAE5', text: '#059669' },
  partial: { bg: '#FEF3C7', text: '#D97706' },
  refunded: { bg: '#FEE2E2', text: '#DC2626' },
  active: { bg: '#D1FAE5', text: '#059669' },
  inactive: { bg: '#FEE2E2', text: '#DC2626' },
  suspended: { bg: '#FEE2E2', text: '#DC2626' },
  trial: { bg: '#DBEAFE', text: '#2563EB' },
};

export function StatusBadge({ status, type = 'general' }: StatusBadgeProps) {
  const colors = useColors();
  const language = useI18nStore((s) => s.language);
  const normalized = status.toLowerCase();
  const colors_map = statusColors[normalized] || { bg: colors.gray100, text: colors.gray600 };

  return (
    <View style={[styles.badge, { backgroundColor: colors_map.bg }]}>
      <Text style={[styles.text, { color: colors_map.text }]}>
        {tStatus(status, language)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
