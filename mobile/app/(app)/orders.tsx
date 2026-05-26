import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing, fontSize, borderRadius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { dbOrders, dbCustomers } from '@/lib/database';
import { useAuthStore } from '@/stores/authStore';
import { useI18nStore } from '@/stores/i18nStore';
import { t, tStatus } from '@/lib/i18n';
import { format } from 'date-fns';

const STATUS_FILTERS = ['all', 'pending', 'washing', 'drying', 'ironing', 'packing', 'finished', 'delivered'];

export default function OrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const language = useI18nStore((s) => s.language);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders?limit=50');
      const ordersData = data.data || [];
      setOrders(ordersData);
      const { tenantId, companyId } = useAuthStore.getState();
      ordersData.forEach((o: any) =>
        dbOrders.upsert({ ...o, tenant_id: o.tenant_id || tenantId, company_id: o.company_id || companyId }, 'synced')
      );
    } catch {
      const local = await dbOrders.getAll();
      setOrders(local);
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

  const styles = React.useMemo(() => StyleSheet.create({
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
    filterList: { maxHeight: 36, marginVertical: spacing.sm },
    filterContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center', paddingVertical: 2 },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.gray100,
      justifyContent: 'center',
      minHeight: 32,
    },
    filterChipActive: { backgroundColor: colors.primary },
    filterText: {},
    listContent: { padding: spacing.md, paddingBottom: 100 },
    orderList: { flex: 1 },
    orderCard: { marginBottom: spacing.sm },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    orderBody: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
    orderInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  }), [colors]);

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
          <ThemedText variant="title">{t('orders.title', language)}</ThemedText>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('orders.search.placeholder', language)}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          style={styles.filterList}
          nestedScrollEnabled
        >
          {STATUS_FILTERS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <ThemedText
                variant="caption"
                color={activeFilter === item ? colors.white : colors.textSecondary}
                style={styles.filterText}
              >
                {item === 'all' ? t('orders.filter.all', language) : tStatus(item, language)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          style={styles.orderList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={t('orders.empty.title', language)}
              description={search ? t('orders.empty.search', language) : t('orders.empty.desc', language)}
              actionLabel={!search ? t('orders.empty.action', language) : undefined}
              onAction={() => router.push('/(app)/pos')}
            />
          }
        />
      </View>
    </ThemedView>
  );
}


