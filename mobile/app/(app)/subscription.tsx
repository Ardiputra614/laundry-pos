import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing, borderRadius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { Modal } from 'react-native';

interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_branches: number;
  features: any;
  is_active: boolean;
}

export default function SubscriptionScreen() {
  const colors = useColors();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const { fetchSubscription } = useSubscriptionStore();

  const fetchData = async () => {
    try {
      const [subRes, planRes] = await Promise.all([
        api.get('/subscription').catch(() => ({ data: { data: null } })),
        api.get('/plans'),
      ]);
      setSubscription(subRes.data.data);
      setPlans(planRes.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSelectPlan = async (planId: string) => {
    setSelecting(true);
    try {
      const { data } = await api.post('/subscription/select-plan', {
        plan_id: planId,
        billing_cycle: 'monthly',
      });
      setSubscription(data.data);
      fetchSubscription();
      Toast.show({ type: 'success', text1: 'Paket Dipilih', text2: 'Silakan lanjutkan pembayaran' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    } finally {
      setSelecting(false);
    }
  };

  const handlePay = async () => {
    if (!subscription) return;
    setPaying(true);
    try {
      const { data } = await api.post('/subscription/create-payment', {
        plan_id: subscription.plan_id,
        billing_cycle: subscription.billing_cycle || 'monthly',
      });

      if (data.data.redirect_url) {
        setPaymentUrl(data.data.redirect_url);
        setShowPayment(true);
      } else {
        Toast.show({ type: 'error', text1: 'Gagal', text2: 'URL pembayaran tidak tersedia' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    } finally {
      setPaying(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `Rp ${(price / 1000000).toFixed(1)}jt`;
    if (price >= 1000) return `Rp ${(price / 1000).toFixed(0)}rb`;
    return `Rp ${price.toLocaleString()}`;
  };

  const styles = React.useMemo(() => StyleSheet.create({
    content: { paddingBottom: spacing.xxl },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
    section: { marginHorizontal: spacing.md, marginBottom: spacing.md },
    sectionTitle: { marginBottom: spacing.sm },
    subsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    planCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 2, borderColor: colors.border, overflow: 'hidden' },
    planCardActive: { borderColor: colors.primary },
    currentBadge: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginBottom: spacing.sm },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
    planPrice: { alignItems: 'flex-end' },
    featureList: { gap: spacing.sm },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  const isPending = subscription?.status === 'pending';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trial';

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText variant="title">Langganan</ThemedText>
        </View>

        {subscription && (
          <Card style={styles.section}>
            <ThemedText variant="heading" style={styles.sectionTitle}>Langganan</ThemedText>
            <View style={styles.subsRow}>
              <ThemedText variant="body" color={colors.textSecondary}>Paket</ThemedText>
              <ThemedText variant="body" weight="semibold" style={{ textTransform: 'capitalize' }}>
                {subscription.plan_name || '-'}
              </ThemedText>
            </View>
            <View style={styles.subsRow}>
              <ThemedText variant="body" color={colors.textSecondary}>Status</ThemedText>
              <StatusBadge status={subscription.status} type="subscription" />
            </View>
            {subscription.current_period_end && (
              <View style={styles.subsRow}>
                <ThemedText variant="body" color={colors.textSecondary}>Berakhir</ThemedText>
                <ThemedText variant="body">
                  {new Date(subscription.current_period_end).toLocaleDateString('id-ID')}
                </ThemedText>
              </View>
            )}
            {isPending && (
              <Button
                title="Bayar Sekarang"
                onPress={handlePay}
                size="lg"
                loading={paying}
                style={{ marginTop: spacing.md }}
              />
            )}
          </Card>
        )}

        <ThemedText variant="heading" style={[styles.sectionTitle, { paddingHorizontal: spacing.md }]}>
          Pilih Paket
        </ThemedText>

        {plans.filter((p) => p.is_active).map((plan) => {
          const isCurrent = subscription?.plan_id === plan.id;
          const canSelect = !isCurrent && !isActive;
          return (
            <Card key={plan.id} style={[styles.planCard, isCurrent && styles.planCardActive]}>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <ThemedText variant="caption" color={colors.white}>
                    {isPending ? 'Terpilih' : 'Paket Saat Ini'}
                  </ThemedText>
                </View>
              )}
              <View style={styles.planHeader}>
                <ThemedText variant="heading">{plan.name}</ThemedText>
                <View style={styles.planPrice}>
                  <ThemedText variant="title" color={colors.primary}>
                    {formatPrice(plan.price_monthly)}
                  </ThemedText>
                  <ThemedText variant="caption" color={colors.textSecondary}>/bulan</ThemedText>
                </View>
              </View>

              {plan.description && (
                <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                  {plan.description}
                </ThemedText>
              )}

              <View style={styles.featureList}>
                <Feature icon="people-outline" text={`${plan.max_users} pengguna`} />
                <Feature icon="business-outline" text={`${plan.max_branches} cabang`} />
                {!!plan.features?.max_outlets && (
                  <Feature icon="grid-outline" text={`${plan.features.max_outlets} outlet`} />
                )}
              </View>

              {canSelect && (
                <Button
                  title={isPending && !isCurrent ? `Ganti ke ${plan.name}` : `Pilih ${plan.name}`}
                  onPress={() => handleSelectPlan(plan.id)}
                  loading={selecting}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </Card>
          );
        })}
      </ScrollView>

      {showPayment && paymentUrl && (
        <Modal visible={showPayment} animationType="slide" style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingTop: 50 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
              <ThemedText variant="heading">Pembayaran</ThemedText>
              <TouchableOpacity onPress={() => { setShowPayment(false); setPaymentUrl(''); fetchData(); }}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: paymentUrl }}
              style={{ flex: 1 }}
              onNavigationStateChange={(navState) => {
                if (navState.url.includes('status=success') || navState.url.includes('transaction_status=settlement')) {
                  setShowPayment(false);
                  setPaymentUrl('');
                  Toast.show({ type: 'success', text1: 'Pembayaran Berhasil', text2: 'Langganan diaktifkan' });
                  fetchSubscription();
                  fetchData();
                }
              }}
            />
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={featureStyles.featureItem}>
      <Ionicons name={icon as any} size={18} color={colors.success} />
      <ThemedText variant="body">{text}</ThemedText>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});


