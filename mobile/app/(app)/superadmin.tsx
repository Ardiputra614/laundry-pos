import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { colors, spacing, borderRadius, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/providers/AuthProvider';

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
  sort_order: number;
}

export default function SuperadminScreen() {
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'companies' | 'plans'>('overview');

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

  const fetchData = async () => {
    try {
      const [statsRes, compRes, planRes] = await Promise.all([
        api.get('/superadmin/dashboard/stats'),
        api.get('/superadmin/companies?limit=50'),
        api.get('/superadmin/plans'),
      ]);
      setStats(statsRes.data.data);
      setCompanies(compRes.data.data || []);
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

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanCode('');
    setPlanDesc('');
    setPlanPriceMonthly('');
    setPlanPriceYearly('');
    setPlanMaxUsers('5');
    setPlanMaxBranches('1');
    setShowPlanModal(true);
  };

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanCode(plan.code);
    setPlanDesc(plan.description || '');
    setPlanPriceMonthly(plan.price_monthly.toString());
    setPlanPriceYearly(plan.price_yearly.toString());
    setPlanMaxUsers(plan.max_users.toString());
    setPlanMaxBranches(plan.max_branches.toString());
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    if (!planName.trim() || !planCode.trim()) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Nama dan kode paket wajib diisi' });
      return;
    }
    setSavingPlan(true);
    try {
      const payload = {
        name: planName,
        code: planCode,
        description: planDesc,
        price_monthly: parseFloat(planPriceMonthly) || 0,
        price_yearly: parseFloat(planPriceYearly) || 0,
        max_users: parseInt(planMaxUsers) || 5,
        max_branches: parseInt(planMaxBranches) || 1,
        max_outlets: parseInt(planMaxBranches) || 1,
        features: {},
        is_active: true,
        sort_order: 0,
      };

      if (editingPlan) {
        await api.put(`/superadmin/plans/${editingPlan.id}`, payload);
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket diperbarui' });
      } else {
        await api.post('/superadmin/plans', payload);
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket ditambahkan' });
      }
      setShowPlanModal(false);
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    } finally {
      setSavingPlan(false);
    }
  };

  const deletePlan = (plan: Plan) => {
    Alert.alert('Hapus Paket', `Yakin ingin menghapus ${plan.name}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/superadmin/plans/${plan.id}`);
          Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket dihapus' });
          fetchData();
        } catch (error: any) {
          Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
        }
      }},
    ]);
  };

  const handleSuspend = (company: any) => {
    Alert.alert(
      company.is_suspended ? 'Aktifkan Company' : 'Nonaktifkan Company',
      `Yakin ingin ${company.is_suspended ? 'mengaktifkan' : 'menonaktifkan'} ${company.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: company.is_suspended ? 'Aktifkan' : 'Nonaktifkan',
          style: company.is_suspended ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const url = company.is_suspended
                ? `/superadmin/companies/${company.id}/activate`
                : `/superadmin/companies/${company.id}/suspend`;
              await api.put(url);
              Toast.show({ type: 'success', text1: 'Berhasil', text2: `Status ${company.name} diperbarui` });
              fetchData();
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText variant="title">Superadmin</ThemedText>
          <StatusBadge status="superadmin" />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'overview' && styles.tabActive]} onPress={() => setTab('overview')}>
            <ThemedText color={tab === 'overview' ? colors.white : colors.textSecondary}>Overview</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'companies' && styles.tabActive]} onPress={() => setTab('companies')}>
            <ThemedText color={tab === 'companies' ? colors.white : colors.textSecondary}>Companies</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'plans' && styles.tabActive]} onPress={() => setTab('plans')}>
            <ThemedText color={tab === 'plans' ? colors.white : colors.textSecondary}>Paket</ThemedText>
          </TouchableOpacity>
        </View>

        {tab === 'overview' && stats && (
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

        {tab === 'companies' && (
          companies.map((company) => (
            <Card key={company.id} style={styles.companyCard}>
              <View style={styles.companyHeader}>
                <View style={styles.companyInfo}>
                  <ThemedText variant="body" weight="semibold">{company.name}</ThemedText>
                  <ThemedText variant="caption" color={colors.textSecondary}>{company.email}</ThemedText>
                </View>
                <StatusBadge status={company.is_suspended ? 'suspended' : company.sub_status} type="subscription" />
              </View>
              <View style={styles.companyMeta}>
                <MetaBadge icon="people-outline" text={`${company.user_count} user`} />
                <MetaBadge icon="business-outline" text={company.plan} />
                <MetaBadge icon="calendar-outline" text={new Date(company.created_at).toLocaleDateString('id-ID')} />
              </View>
              <View style={styles.companyActions}>
                <Button title={company.is_suspended ? 'Aktifkan' : 'Nonaktifkan'} variant={company.is_suspended ? 'outline' : 'danger'} size="sm" onPress={() => handleSuspend(company)} />
              </View>
            </Card>
          ))
        )}

        {tab === 'plans' && (
          <>
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
          </>
        )}
      </ScrollView>

      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="heading">{editingPlan ? 'Edit Paket' : 'Tambah Paket'}</ThemedText>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
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

function StatRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.statRow}>
      <ThemedText variant="body" color={colors.textSecondary}>{label}</ThemedText>
      <ThemedText variant="body" weight="semibold">{value}</ThemedText>
    </View>
  );
}

function MetaBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.metaBadge}>
      <Ionicons name={icon as any} size={14} color={colors.gray400} />
      <ThemedText variant="caption" color={colors.gray500}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  tabRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  tabBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.gray100, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: spacing.md },
  section: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  companyCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  companyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  companyInfo: { flex: 1 },
  companyMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  companyActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.md },
  planCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  planPrices: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  planLimits: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  planActions: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
});
