import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing, borderRadius, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useI18nStore } from '@/stores/i18nStore';
import { t, tStatus } from '@/lib/i18n';

type FilterPeriod = 'today' | 'month' | 'year' | 'all';

interface ServiceUsage {
  service_name: string;
  count: number;
  revenue: number;
}

interface ReportData {
  total_orders: number;
  total_revenue: number;
  total_discount: number;
  total_tax: number;
  net_revenue: number;
  avg_per_day: number;
  start_date: string;
  end_date: string;
  service_usage: ServiceUsage[];
  orders_by_status: Record<string, number>;
}

const FILTER_LABELS: Record<FilterPeriod, { id: string; en: string }> = {
  today: { id: 'Hari Ini', en: 'Today' },
  month: { id: 'Bulan Ini', en: 'This Month' },
  year: { id: 'Tahun Ini', en: 'This Year' },
  all: { id: 'Semua', en: 'All' },
};

function getDateRange(period: FilterPeriod): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (period) {
    case 'today':
      return { start: fmt(now), end: fmt(now) };
    case 'month':
      return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(now) };
    case 'year':
      return { start: fmt(new Date(now.getFullYear(), 0, 1)), end: fmt(now) };
    case 'all':
      return { start: '', end: '' };
  }
}

function BarChart({ data, color }: { data: { label: string; value: number; maxValue: number }[]; color: string }) {
  const colors = useColors();
  const barStyles = React.useMemo(() => StyleSheet.create({
    chartContainer: { gap: spacing.sm },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    barLabel: { width: 80 },
    barTrack: { flex: 1, height: 20, backgroundColor: colors.gray100, borderRadius: borderRadius.sm, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: borderRadius.sm, minWidth: 4 },
    barValue: { width: 40, textAlign: 'right' },
  }), [colors]);
  if (data.length === 0) return null;
  return (
    <View style={barStyles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={barStyles.barRow}>
          <ThemedText variant="caption" style={barStyles.barLabel} numberOfLines={1}>{item.label}</ThemedText>
          <View style={barStyles.barTrack}>
            <View style={[barStyles.barFill, { width: item.maxValue > 0 ? `${Math.max((item.value / item.maxValue) * 100, 2)}%` : '2%', backgroundColor: color }]} />
          </View>
          <ThemedText variant="caption" weight="semibold" style={barStyles.barValue}>{item.value}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function ReportScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [report, setReport] = useState<ReportData | null>(null);

  const fetchReport = async (p: FilterPeriod) => {
    const { start, end } = getDateRange(p);
    const params = new URLSearchParams();
    if (start) params.append('start_date', start);
    if (end) params.append('end_date', end);
    const qs = params.toString();

    try {
      const { data } = await api.get(`/reports${qs ? '?' + qs : ''}`);
      setReport(data.data || null);
    } catch {
      setReport(null);
    }
  };

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      await fetchReport(period);
      setLoading(false);
    })();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport(period);
    setRefreshing(false);
  };

  const changePeriod = async (p: FilterPeriod) => {
    setPeriod(p);
    setLoading(true);
    await fetchReport(p);
    setLoading(false);
  };

  const maxUsageCount = report?.service_usage?.length
    ? Math.max(...report.service_usage.map((s) => s.count), 1)
    : 1;

  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    washing: '#3B82F6',
    drying: '#8B5CF6',
    ironing: '#EC4899',
    packing: '#14B8A6',
    finished: '#10B981',
    delivered: '#6B7280',
    cancelled: '#EF4444',
  };

  const language = useI18nStore((s) => s.language);

  const styles = React.useMemo(() => StyleSheet.create({
    content: { paddingBottom: 100 },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
    filterRow: { marginVertical: spacing.sm },
    filterContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.gray100,
      justifyContent: 'center',
    },
    filterChipActive: { backgroundColor: colors.primary },
    statsRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
    statCard: { flex: 1, padding: spacing.sm, alignItems: 'center' },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F0F0FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    section: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md },
    sectionTitle: { marginBottom: spacing.md },
    revenueCard: { backgroundColor: colors.gray50, borderRadius: borderRadius.md, padding: spacing.md },
    revenueMain: { alignItems: 'center', paddingVertical: spacing.sm },
    revenueDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
    revenueDetail: { gap: spacing.xs },
    revenueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    profitBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: spacing.md },
    profitSegment: { height: '100%' },
    profitLegend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText variant="title">{t('report.title', language)}</ThemedText>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          style={styles.filterRow}
        >
          {(Object.keys(FILTER_LABELS) as FilterPeriod[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, period === key && styles.filterChipActive]}
              onPress={() => changePeriod(key)}
            >
              <ThemedText
                variant="caption"
                color={period === key ? colors.white : colors.textSecondary}
              >
                {FILTER_LABELS[key][language]}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {report ? (
          <>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                </View>
                <ThemedText variant="heading" color={colors.primary}>{report.total_orders}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>{t('report.total_orders', language)}</ThemedText>
              </Card>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="cash-outline" size={20} color="#4F46E5" />
                </View>
                <ThemedText variant="heading" color="#4F46E5">Rp {(report.total_revenue || 0).toLocaleString()}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>{t('report.revenue', language)}</ThemedText>
              </Card>
              <Card style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="trending-up-outline" size={20} color="#16A34A" />
                </View>
                <ThemedText variant="heading" color="#16A34A">{report.avg_per_day.toFixed(1)}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>{t('report.avg_per_day', language)}</ThemedText>
              </Card>
            </View>

            <Card style={styles.section}>
              <ThemedText variant="heading" style={styles.sectionTitle}>{t('report.keuntungan', language)}</ThemedText>
              <View style={styles.revenueCard}>
                <View style={styles.revenueMain}>
                  <ThemedText variant="caption" color={colors.textSecondary}>{t('report.total_revenue', language)}</ThemedText>
                  <ThemedText variant="heading" color={colors.primary}>Rp {(report.total_revenue || 0).toLocaleString()}</ThemedText>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueDetail}>
                  <View style={styles.revenueRow}>
                    <ThemedText variant="caption" color={colors.danger}>{t('report.discount', language)}</ThemedText>
                    <ThemedText variant="caption" color={colors.danger}>- Rp {(report.total_discount || 0).toLocaleString()}</ThemedText>
                  </View>
                  <View style={styles.revenueRow}>
                    <ThemedText variant="caption" color="#4F46E5">{t('report.tax', language)}</ThemedText>
                    <ThemedText variant="caption" color="#4F46E5">+ Rp {(report.total_tax || 0).toLocaleString()}</ThemedText>
                  </View>
                  <View style={styles.revenueDivider} />
                  <View style={styles.revenueRow}>
                    <ThemedText variant="body" weight="semibold">{t('report.net_profit', language)}</ThemedText>
                    <ThemedText variant="body" weight="semibold" color="#16A34A">Rp {(report.net_revenue || 0).toLocaleString()}</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.profitBar}>
                <View style={[styles.profitSegment, { flex: Math.max(report.total_revenue - report.total_discount, 1), backgroundColor: '#16A34A' }]} />
                <View style={[styles.profitSegment, { flex: Math.max(report.total_discount, 1), backgroundColor: '#EF4444' }]} />
                <View style={[styles.profitSegment, { flex: Math.max(report.total_tax, 1), backgroundColor: '#6366F1' }]} />
              </View>
              <View style={styles.profitLegend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} /><ThemedText variant="caption">{t('report.net', language)}</ThemedText></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><ThemedText variant="caption">Diskon</ThemedText></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} /><ThemedText variant="caption">Pajak</ThemedText></View>
              </View>
            </Card>

            {report.service_usage && report.service_usage.length > 0 && (
              <Card style={styles.section}>
                <ThemedText variant="heading" style={styles.sectionTitle}>{t('report.services_used', language)}</ThemedText>
                <BarChart
                  data={report.service_usage.map((s) => ({
                    label: s.service_name,
                    value: s.count,
                    maxValue: maxUsageCount,
                  }))}
                  color={colors.primary}
                />
              </Card>
            )}

            {report.orders_by_status && Object.keys(report.orders_by_status).length > 0 && (
              <Card style={styles.section}>
                <ThemedText variant="heading" style={styles.sectionTitle}>{t('report.by_status', language)}</ThemedText>
                <BarChart
                  data={Object.entries(report.orders_by_status).map(([status, count]) => ({
                    label: tStatus(status, language),
                    value: count,
                    maxValue: Math.max(...Object.values(report.orders_by_status!), 1),
                  }))}
                  color="#8B5CF6"
                />
              </Card>
            )}

            {report.service_usage?.length === 0 && (
              <Card style={styles.section}>
                <View style={{ alignItems: 'center', padding: spacing.lg }}>
                  <Ionicons name="bar-chart-outline" size={48} color={colors.gray300} />
                  <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
                    Belum ada data untuk periode ini
                  </ThemedText>
                </View>
              </Card>
            )}
          </>
        ) : (
          <Card style={styles.section}>
            <View style={{ alignItems: 'center', padding: spacing.lg }}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.gray300} />
              <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
                Gagal memuat laporan
              </ThemedText>
            </View>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}


