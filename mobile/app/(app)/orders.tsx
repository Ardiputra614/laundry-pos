import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { colors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { format } from 'date-fns';

const STATUS_FILTERS = ['all', 'pending', 'washing', 'drying', 'ironing', 'packing', 'finished', 'delivered'];

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders?limit=50');
      setOrders(data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchOrders();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'all' || o.status === activeFilter;
    const customerName = o.customer_name || o.customer?.name || '';
    const matchesSearch = !search ||
      o.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/(app)/order/${item.id}`)}>
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <ThemedText variant="body" weight="semibold">{item.invoice_number}</ThemedText>
          <StatusBadge status={item.status} type="order" />
        </View>
        <View style={styles.orderBody}>
          <View style={styles.orderInfo}>
            <Ionicons name="person-outline" size={14} color={colors.gray400} />
            <ThemedText variant="caption">{item.customer_name || item.customer?.name || 'Walk-in'}</ThemedText>
          </View>
          <View style={styles.orderInfo}>
            <Ionicons name="calendar-outline" size={14} color={colors.gray400} />
            <ThemedText variant="caption">
              {item.estimated_done_at ? format(new Date(item.estimated_done_at), 'dd MMM') : '-'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.orderFooter}>
          <ThemedText variant="body" weight="semibold" color={colors.primary}>
            Rp {item.grand_total?.toLocaleString() || '0'}
          </ThemedText>
          <StatusBadge status={item.payment_status} type="payment" />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText variant="title">Orders</ThemedText>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by invoice or customer..."
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={() => router.push('/(app)/scan')} style={styles.scanBtn}>
            <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          horizontal
          data={STATUS_FILTERS}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <ThemedText
                variant="caption"
                color={activeFilter === item ? colors.white : colors.textSecondary}
                style={styles.filterText}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders found"
              description={search ? 'Try a different search' : 'Create your first order'}
              actionLabel={!search ? 'New Order' : undefined}
              onAction={() => router.push('/(app)/pos')}
            />
          }
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: fontSize.md, color: colors.text, marginLeft: spacing.sm },
  scanBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  filterList: { maxHeight: 44, marginVertical: spacing.sm },
  filterContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { textTransform: 'capitalize' },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  orderCard: { marginBottom: spacing.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orderBody: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
});
