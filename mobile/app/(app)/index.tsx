import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { useColors, spacing, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { dbOrders } from '@/lib/database';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ orders_today: 0, revenue_today: 0, pending_orders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const colors = useColors();

  const { width, height } = useWindowDimensions();
  const isPortrait = width < height;

  const fetchDashboard = async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const { data: ordersData } = await api.get(`/orders?limit=50`);
      if (ordersData.data) {
        const orders = ordersData.data;
        setRecentOrders(orders.slice(0, 5));
        const today = orders.filter((o: any) => {
          const d = new Date(o.created_at);
          const now = new Date();
          return d.toDateString() === now.toDateString();
        });
        setStats({
          orders_today: today.length,
          revenue_today: today.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0),
          pending_orders: orders.filter((o: any) => o.status === 'pending').length,
        });
        const { tenantId, companyId } = useAuthStore.getState();
        orders.forEach((o: any) =>
          dbOrders.upsert({ ...o, tenant_id: o.tenant_id || tenantId, company_id: o.company_id || companyId }, 'synced')
        );
      }
    } catch {
      const local = await dbOrders.getRecent(3);
      const recent = local.slice(0, 5);
      setRecentOrders(recent);
      const today = recent.filter((o: any) => {
        const d = new Date(o.created_at);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      });
      setStats({
        orders_today: today.length,
        revenue_today: today.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0),
        pending_orders: recent.filter((o: any) => o.status === 'pending').length,
      });
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    scrollView: { flex: 1 },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    statCard: { flex: 1, alignItems: 'center', padding: spacing.md },
    quickActions: { marginBottom: spacing.lg },
    sectionTitle: { marginBottom: spacing.sm },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    actionRow: { flexDirection: 'row', gap: spacing.sm },
    actionButton: { flex: 1, alignItems: 'center', backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: 12 },
    recentOrders: { marginBottom: spacing.lg },
    orderCard: { marginBottom: spacing.sm },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  }), [colors]);

  return (
    <ThemedView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <ThemedText variant="caption">Welcome back,</ThemedText>
            <ThemedText variant="title">{user?.full_name || 'User'}</ThemedText>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/profile')}>
            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {isPortrait ? (
          <View>
            <View style={styles.statsRow}>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <ThemedText variant="hero" color={colors.primary}>{stats.orders_today}</ThemedText>
                <ThemedText variant="caption">Orders Today</ThemedText>
              </Card>
              <Card style={[styles.statCard, { flex: 1 }]}>
                <ThemedText variant="hero" color={colors.warning}>{stats.pending_orders}</ThemedText>
                <ThemedText variant="caption">Pending</ThemedText>
              </Card>
            </View>
            <Card style={[styles.statCard, { flex: 0, width: '100%', marginBottom: spacing.lg }]}>
              <ThemedText variant="hero" color={colors.success}>
                Rp {stats.revenue_today.toLocaleString()}
              </ThemedText>
              <ThemedText variant="caption">Revenue Today</ThemedText>
            </Card>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <ThemedText variant="hero" color={colors.primary}>{stats.orders_today}</ThemedText>
              <ThemedText variant="caption">Orders Today</ThemedText>
            </Card>
            <Card style={styles.statCard}>
              <ThemedText variant="hero" color={colors.success}>
                Rp {stats.revenue_today.toLocaleString()}
              </ThemedText>
              <ThemedText variant="caption">Revenue Today</ThemedText>
            </Card>
            <Card style={styles.statCard}>
              <ThemedText variant="hero" color={colors.warning}>{stats.pending_orders}</ThemedText>
              <ThemedText variant="caption">Pending</ThemedText>
            </Card>
          </View>
        )}

        <View style={styles.quickActions}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(app)/pos')}>
              <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
              <ThemedText variant="caption">New Order</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(app)/orders')}>
              <Ionicons name="list-outline" size={28} color={colors.primary} />
              <ThemedText variant="caption">All Orders</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentOrders}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="heading">Recent Orders</ThemedText>
            <Button title="See All" onPress={() => router.push('/(app)/orders')} variant="ghost" size="sm" />
          </View>
          {recentOrders.length === 0 ? (
            <Card>
              <ThemedText variant="body" color={colors.textSecondary}>No orders yet</ThemedText>
            </Card>
          ) : (
            recentOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/(app)/order/${order.id}`)}
              >
                <Card style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <ThemedText variant="body" weight="semibold">{order.invoice_number}</ThemedText>
                    <StatusBadge status={order.status} type="order" />
                  </View>
                  <View style={styles.orderDetails}>
                    <ThemedText variant="caption">{order.customer?.name || 'Walk-in'}</ThemedText>
                    <ThemedText variant="caption" color={colors.textSecondary}>
                      {order.created_at ? format(new Date(order.created_at), 'dd MMM HH:mm') : ''}
                    </ThemedText>
                  </View>
                  <ThemedText variant="body" weight="semibold" color={colors.primary}>
                    Rp {order.grand_total?.toLocaleString() || '0'}
                  </ThemedText>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}


