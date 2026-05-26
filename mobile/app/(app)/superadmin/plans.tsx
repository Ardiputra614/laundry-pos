import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing, borderRadius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

interface Plan {
  id: string; name: string; code: string; description: string;
  price_monthly: number; price_yearly: number; max_users: number;
  max_branches: number; features: any; is_active: boolean; sort_order: number;
}

export default function PlansScreen() {
  const colors = useColors();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPriceMonthly, setPlanPriceMonthly] = useState('');
  const [planPriceYearly, setPlanPriceYearly] = useState('');
  const [planMaxUsers, setPlanMaxUsers] = useState('5');
  const [planMaxBranches, setPlanMaxBranches] = useState('1');
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/superadmin/plans');
      setPlans(data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  const openAddPlan = () => {
    setEditingPlan(null); setPlanName(''); setPlanCode(''); setPlanDesc('');
    setPlanPriceMonthly(''); setPlanPriceYearly(''); setPlanMaxUsers('5'); setPlanMaxBranches('1');
    setShowPlanModal(true);
  };

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan); setPlanName(plan.name); setPlanCode(plan.code);
    setPlanDesc(plan.description || ''); setPlanPriceMonthly(plan.price_monthly.toString());
    setPlanPriceYearly(plan.price_yearly.toString()); setPlanMaxUsers(plan.max_users.toString());
    setPlanMaxBranches(plan.max_branches.toString()); setShowPlanModal(true);
  };

  const savePlan = async () => {
    if (!planName.trim() || !planCode.trim()) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Nama dan kode paket wajib diisi' }); return;
    }
    setSavingPlan(true);
    try {
      const payload = {
        name: planName, code: planCode, description: planDesc,
        price_monthly: parseFloat(planPriceMonthly) || 0, price_yearly: parseFloat(planPriceYearly) || 0,
        max_users: parseInt(planMaxUsers) || 5, max_branches: parseInt(planMaxBranches) || 1,
        max_outlets: parseInt(planMaxBranches) || 1, features: {}, is_active: true, sort_order: 0,
      };
      if (editingPlan) {
        await api.put(`/superadmin/plans/${editingPlan.id}`, payload);
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket diperbarui' });
      } else {
        await api.post('/superadmin/plans', payload);
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket ditambahkan' });
      }
      setShowPlanModal(false);
      fetchPlans();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    }
    setSavingPlan(false);
  };

  const deletePlan = (plan: Plan) => {
    Alert.alert('Hapus Paket', `Yakin ingin menghapus ${plan.name}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/superadmin/plans/${plan.id}`);
          Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket dihapus' });
          fetchPlans();
        } catch (error: any) {
          Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
        }
      }},
    ]);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    planCard: { marginBottom: spacing.sm },
    planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    planPrices: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
    planLimits: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
    planActions: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.planHeader}>
          <ThemedText variant="heading">Paket Langganan</ThemedText>
          <TouchableOpacity onPress={openAddPlan}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {plans.map((plan) => (
          <Card key={plan.id} style={styles.planCard}>
            <View style={styles.planTop}>
              <View>
                <ThemedText variant="body" weight="semibold">{plan.name}</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>Kode: {plan.code}</ThemedText>
              </View>
              <StatusBadge status={plan.is_active ? 'active' : 'inactive'} type="subscription" />
            </View>
            <View style={styles.planPrices}>
              <ThemedText variant="body">Rp {(plan.price_monthly || 0).toLocaleString()}/bln</ThemedText>
              <ThemedText variant="caption" color={colors.textSecondary}>|</ThemedText>
              <ThemedText variant="body">Rp {(plan.price_yearly || 0).toLocaleString()}/thn</ThemedText>
            </View>
            <View style={styles.planLimits}>
              <MetaBadge icon="people-outline" text={`${plan.max_users} user`} />
              <MetaBadge icon="business-outline" text={`${plan.max_branches} cabang`} />
            </View>
            <View style={styles.planActions}>
              <Button title="Edit" variant="outline" size="sm" onPress={() => openEditPlan(plan)} />
              <Button title="Hapus" variant="danger" size="sm" onPress={() => deletePlan(plan)} />
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="heading">{editingPlan ? 'Edit Paket' : 'Tambah Paket'}</ThemedText>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="Nama Paket *" placeholder="Basic, Professional, dll" value={planName} onChangeText={setPlanName} />
              <Input label="Kode *" placeholder="basic, professional, enterprise" value={planCode} onChangeText={setPlanCode} autoCapitalize="none" />
              <Input label="Deskripsi" placeholder="Deskripsi paket" value={planDesc} onChangeText={setPlanDesc} multiline numberOfLines={2} />
              <Input label="Harga Bulanan" placeholder="199000" value={planPriceMonthly} onChangeText={setPlanPriceMonthly} keyboardType="numeric" />
              <Input label="Harga Tahunan" placeholder="1990000" value={planPriceYearly} onChangeText={setPlanPriceYearly} keyboardType="numeric" />
              <Input label="Max User" placeholder="5" value={planMaxUsers} onChangeText={setPlanMaxUsers} keyboardType="numeric" />
              <Input label="Max Cabang" placeholder="1" value={planMaxBranches} onChangeText={setPlanMaxBranches} keyboardType="numeric" />
              <Button title={editingPlan ? 'Simpan' : 'Tambah'} onPress={savePlan} loading={savingPlan} style={{ marginTop: 12 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function MetaBadge({ icon, text }: { icon: string; text: string }) {
  const colors = useColors();
  return (
    <View style={badgeStyles.metaBadge}>
      <Ionicons name={icon as any} size={14} color={colors.gray400} />
      <ThemedText variant="caption" color={colors.gray500}>{text}</ThemedText>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});


