import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function OverviewScreen() {
  const colors = useColors();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/superadmin/dashboard/stats');
      setStats(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {stats && (
          <>
            <View style={styles.statsGrid}>
              <Card style={styles.statCard}>
                <Ionicons name="business-outline" size={24} color={colors.primary} />
                <ThemedText variant="hero" color={colors.primary}>{stats.total_companies}</ThemedText>
                <ThemedText variant="caption">Total Company</ThemedText>
              </Card>
              <Card style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                <ThemedText variant="hero" color={colors.success}>{stats.active_companies}</ThemedText>
                <ThemedText variant="caption">Aktif</ThemedText>
              </Card>
              <Card style={styles.statCard}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
                <ThemedText variant="hero" color={colors.warning}>{stats.suspended_companies}</ThemedText>
                <ThemedText variant="caption">Dinonaktifkan</ThemedText>
              </Card>
              <Card style={styles.statCard}>
                <Ionicons name="flask-outline" size={24} color={colors.info} />
                <ThemedText variant="hero" color={colors.info}>{stats.trial_companies}</ThemedText>
                <ThemedText variant="caption">Trial</ThemedText>
              </Card>
            </View>
            <Card style={styles.section}>
              <ThemedText variant="heading" style={styles.sectionTitle}>Ringkasan</ThemedText>
              <StatRow label="Langganan Aktif" value={stats.active_subscriptions} />
              <StatRow label="Company Baru (Bulan Ini)" value={stats.new_companies_this_month} />
              <StatRow label="Pendapatan Bulan Ini" value={`Rp ${(stats.monthly_revenue || 0).toLocaleString()}`} />
              <StatRow label="Total Pendapatan" value={`Rp ${(stats.total_revenue || 0).toLocaleString()}`} />
            </Card>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function StatRow({ label, value }: { label: string; value: any }) {
  const colors = useColors();
  return (
    <View style={styles.statRow}>
      <ThemedText variant="body" color={colors.textSecondary}>{label}</ThemedText>
      <ThemedText variant="body" weight="semibold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
});
