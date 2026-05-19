import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { colors, spacing, borderRadius, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import { scanPrinters, connectPrinter, disconnectPrinter, printESC, buildReceipt } from '@/lib/blePrinter';
import { savePrinter, getSavedPrinter, removeSavedPrinter, SavedPrinter } from '@/lib/printerStore';

interface Plan {
  id: string; name: string; code: string; description: string;
  price_monthly: number; price_yearly: number; max_users: number;
  max_branches: number; features: any; is_active: boolean; sort_order: number;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isSuperadmin = user?.role === 'superadmin';

  const [subscription, setSubscription] = useState<any>(null);

  // Settings modals
  const [showChangePw, setShowChangePw] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showPrinter, setShowPrinter] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [selectedLang, setSelectedLang] = useState('id');

  // Printer
  const [bleScanning, setBleScanning] = useState(false);
  const [bleDevices, setBleDevices] = useState<any[]>([]);
  const [bleBusy, setBleBusy] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<SavedPrinter | null>(null);
  const [bleConnected, setBleConnected] = useState(false);

  // Superadmin state
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sATab, setSATab] = useState<'overview' | 'companies' | 'plans'>('overview');

  // Plan modal
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

  useEffect(() => {
    fetchSubscription();
    if (isSuperadmin) fetchSuperData();
  }, []);

  const fetchSubscription = async () => {
    try { const { data } = await api.get('/subscription'); setSubscription(data.data); } catch {}
  };

  const fetchSuperData = async () => {
    try {
      setLoading(true);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscription();
    if (isSuperadmin) await fetchSuperData();
    setRefreshing(false);
  };

  // ---- Printer ----
  React.useEffect(() => { if (showPrinter) loadSaved(); }, [showPrinter]);
  const loadSaved = async () => { const s = await getSavedPrinter(); setSavedPrinter(s); };
  const handleSavePrinter = async (dev: any) => {
    await savePrinter({ id: dev.id, name: dev.name || 'Printer' });
    setSavedPrinter({ id: dev.id, name: dev.name || 'Printer' });
    Toast.show({ type: 'success', text1: 'Printer tersimpan', text2: dev.name || 'Printer' });
  };
  const handleForgetPrinter = () => {
    Alert.alert('Lupakan Printer', 'Yakin ingin menghapus printer tersimpan?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        await removeSavedPrinter(); setSavedPrinter(null);
        Toast.show({ type: 'success', text1: 'Printer dihapus' });
      }},
    ]);
  };
  const connectAndTest = async (dev: any) => {
    setBleBusy(true); setBleConnected(false);
    try {
      const c = await connectPrinter(dev.id); setBleConnected(true);
      const data = buildReceipt({
        invoice_number: 'TEST-001', created_at: new Date().toISOString(), estimated_done_at: null,
        order_type: 'reguler', service_type: 'reguler',
        items: [{ service_name: 'Test Print', quantity: 1, unit: 'pcs', unit_price: 1000, subtotal: 1000 }],
        grand_total: 1000, payment_status: 'unpaid',
      });
      await printESC(c, data); await disconnectPrinter(c); setBleConnected(false);
      Toast.show({ type: 'success', text1: 'Test print berhasil', text2: 'Struk test terkirim ke printer' });
    } catch (e: any) {
      setBleConnected(false);
      Alert.alert('Gagal Test Print', e.message, [
        { text: 'Coba Lagi', onPress: () => connectAndTest(dev) },
        { text: 'OK', style: 'cancel' },
      ]);
    }
    setBleBusy(false);
  };
  const testSavedPrinter = async () => { if (savedPrinter) await connectAndTest(savedPrinter); };
  const scanBle = async () => {
    setBleScanning(true); setBleDevices([]);
    try {
      const d = await scanPrinters(8000); setBleDevices(d);
      if (d.length === 0) Toast.show({ type: 'info', text1: 'Tidak ditemukan', text2: 'Pastikan printer dalam mode pairing' });
    } catch { setBleDevices([]); }
    setBleScanning(false);
  };

  // ---- Superadmin ----
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
      if (editingPlan) { await api.put(`/superadmin/plans/${editingPlan.id}`, payload); Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket diperbarui' }); }
      else { await api.post('/superadmin/plans', payload); Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket ditambahkan' }); }
      setShowPlanModal(false); fetchSuperData();
    } catch (error: any) { Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message }); }
    setSavingPlan(false);
  };
  const deletePlan = (plan: Plan) => {
    Alert.alert('Hapus Paket', `Yakin ingin menghapus ${plan.name}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try { await api.delete(`/superadmin/plans/${plan.id}`); Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Paket dihapus' }); fetchSuperData(); }
        catch (error: any) { Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message }); }
      }},
    ]);
  };
  const handleSuspend = (company: any) => {
    Alert.alert(company.is_suspended ? 'Aktifkan Company' : 'Nonaktifkan Company',
      `Yakin ingin ${company.is_suspended ? 'mengaktifkan' : 'menonaktifkan'} ${company.name}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: company.is_suspended ? 'Aktifkan' : 'Nonaktifkan', style: company.is_suspended ? 'default' : 'destructive',
        onPress: async () => {
          try {
            const url = company.is_suspended ? `/superadmin/companies/${company.id}/activate` : `/superadmin/companies/${company.id}/suspend`;
            await api.put(url); Toast.show({ type: 'success', text1: 'Berhasil', text2: `Status ${company.name} diperbarui` }); fetchSuperData();
          } catch (error: any) { Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message }); }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); }},
    ]);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { Toast.show({ type: 'error', text1: 'Gagal', text2: 'Password baru tidak cocok' }); return; }
    if (newPassword.length < 8) { Toast.show({ type: 'error', text1: 'Gagal', text2: 'Password minimal 8 karakter' }); return; }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
      Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Password diubah. Silakan login ulang.' });
      setShowChangePw(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); handleLogout();
    } catch (error: any) { Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message }); }
    setChangingPw(false);
  };

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* === PROFILE HEADER === */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.white} />
          </View>
          <ThemedText variant="title" style={styles.name}>{user?.full_name}</ThemedText>
          <ThemedText variant="body" color={colors.textSecondary}>{user?.email}</ThemedText>
          {user?.role && <StatusBadge status={user.role} />}
        </View>

        {/* === SUPERADMIN: Stats Overview === */}
        {isSuperadmin && stats && (
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
        )}

        {/* === SUPERADMIN: Tab nav === */}
        {isSuperadmin && (
          <View style={styles.tabRow}>
            {(['overview', 'companies', 'plans'] as const).map((t) => (
              <TouchableOpacity key={t} style={[styles.tabBtn, sATab === t && styles.tabActive]} onPress={() => setSATab(t)}>
                <ThemedText color={sATab === t ? colors.white : colors.textSecondary}>
                  {t === 'overview' ? 'Overview' : t === 'companies' ? 'Companies' : 'Paket'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* === SUPERADMIN: Overview tab === */}
        {isSuperadmin && sATab === 'overview' && stats && (
          <Card style={styles.section}>
            <ThemedText variant="heading" style={styles.sectionTitle}>Ringkasan</ThemedText>
            <StatRow label="Langganan Aktif" value={stats.active_subscriptions} />
            <StatRow label="Company Baru (Bulan Ini)" value={stats.new_companies_this_month} />
            <StatRow label="Pendapatan Bulan Ini" value={`Rp ${(stats.monthly_revenue || 0).toLocaleString()}`} />
            <StatRow label="Total Pendapatan" value={`Rp ${(stats.total_revenue || 0).toLocaleString()}`} />
          </Card>
        )}

        {/* === SUPERADMIN: Companies tab === */}
        {isSuperadmin && sATab === 'companies' && (
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

        {/* === SUPERADMIN: Plans tab === */}
        {isSuperadmin && sATab === 'plans' && (
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

        {/* === COMPANY ADMIN: Subscription Info === */}
        {!isSuperadmin && subscription && (
          <Card style={styles.section}>
            <View style={styles.subsHeader}>
              <Ionicons name="diamond-outline" size={20} color={colors.primary} />
              <ThemedText variant="heading" style={{ marginLeft: spacing.sm }}>Langganan</ThemedText>
            </View>
            <View style={styles.subsRow}>
              <ThemedText variant="body" color={colors.textSecondary}>Paket</ThemedText>
              <ThemedText variant="body" weight="semibold" style={{ textTransform: 'capitalize' }}>{subscription.plan_name || '-'}</ThemedText>
            </View>
            <View style={styles.subsRow}>
              <ThemedText variant="body" color={colors.textSecondary}>Status</ThemedText>
              <StatusBadge status={subscription.status} type="subscription" />
            </View>
            {subscription.current_period_end && (
              <View style={styles.subsRow}>
                <ThemedText variant="body" color={colors.textSecondary}>Berakhir</ThemedText>
                <ThemedText variant="body" weight="medium">{new Date(subscription.current_period_end).toLocaleDateString('id-ID')}</ThemedText>
              </View>
            )}
          </Card>
        )}

        {/* === ACCOUNT INFO === */}
        {!isSuperadmin && (
          <Card style={styles.section}>
            <ThemedText variant="heading" style={styles.sectionTitle}>Info Akun</ThemedText>
            <InfoRow icon="person-outline" label="Nama" value={user?.full_name} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email} />
            <InfoRow icon="call-outline" label="Telepon" value={user?.phone} />
            <InfoRow icon="shield-checkmark-outline" label="Role" value={user?.role} />
          </Card>
        )}

        {/* === SUBSCRIPTION MENU (company) === */}
        {!isSuperadmin && (
          <Card style={styles.section}>
            <TouchableRow icon="diamond-outline" label="Langganan & Paket" onPress={() => router.push('/(app)/subscription' as any)} />
          </Card>
        )}

        {/* === SETTINGS === */}
        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Pengaturan</ThemedText>
          <TouchableRow icon="print-outline" label="Printer Struk" onPress={() => setShowPrinter(true)} />
          <TouchableRow icon="lock-closed-outline" label="Ubah Password" onPress={() => setShowChangePw(true)} />
          <TouchableRow icon="language-outline" label="Bahasa" onPress={() => setShowLanguage(true)} />
          <TouchableRow icon="information-circle-outline" label="Tentang" onPress={() => setShowAbout(true)} />
        </Card>

        <Button title="Logout" onPress={handleLogout} variant="danger" size="lg" style={styles.logoutBtn} />
      </ScrollView>

      {/* ======== MODALS ======== */}

      {/* Change Password */}
      <Modal visible={showChangePw} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="heading">Ubah Password</ThemedText>
            <TouchableOpacity onPress={() => setShowChangePw(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <Input label="Password Lama" placeholder="Masukkan password lama" value={oldPassword} onChangeText={setOldPassword} secureTextEntry icon="lock-closed-outline" />
          <Input label="Password Baru" placeholder="Minimal 8 karakter" value={newPassword} onChangeText={setNewPassword} secureTextEntry icon="lock-open-outline" />
          <Input label="Konfirmasi Password Baru" placeholder="Ulangi password baru" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon="checkmark-outline" />
          <Button title="Simpan" onPress={handleChangePassword} loading={changingPw} />
        </View></View>
      </Modal>

      {/* Language */}
      <Modal visible={showLanguage} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="heading">Pilih Bahasa</ThemedText>
            <TouchableOpacity onPress={() => setShowLanguage(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          {[{ code: 'id', label: 'Bahasa Indonesia' }, { code: 'en', label: 'English' }].map((lang) => (
            <TouchableOpacity key={lang.code} style={[styles.langItem, selectedLang === lang.code && styles.langItemActive]}
              onPress={() => { setSelectedLang(lang.code); setShowLanguage(false); Toast.show({ type: 'success', text1: 'Berhasil', text2: `Bahasa diubah ke ${lang.label}` }); }}
            >
              <ThemedText variant="body" weight={selectedLang === lang.code ? 'semibold' : 'regular'} color={selectedLang === lang.code ? colors.primary : colors.text}>{lang.label}</ThemedText>
              {selectedLang === lang.code && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View></View>
      </Modal>

      {/* About */}
      <Modal visible={showAbout} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="heading">Tentang Aplikasi</ThemedText>
            <TouchableOpacity onPress={() => setShowAbout(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <View style={styles.aboutSection}>
            <Ionicons name="shirt-outline" size={64} color={colors.primary} />
            <ThemedText variant="title" style={{ marginTop: spacing.md }}>Laundry POS</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary}>Versi 1.0.0</ThemedText>
            <ThemedText variant="caption" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.md }}>
              Aplikasi manajemen laundry profesional.{'\n'}Kelola pesanan, layanan, dan bisnis laundry Anda dalam satu platform.
            </ThemedText>
          </View>
        </View></View>
      </Modal>

      {/* Printer */}
      <Modal visible={showPrinter} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="heading">Pengaturan Printer</ThemedText>
            <TouchableOpacity onPress={() => setShowPrinter(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>

          {savedPrinter && (
            <View style={styles.savedPrinterCard}>
              <View style={styles.savedPrinterLeft}>
                <View style={styles.printerIconWrap}><Ionicons name="print" size={28} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="body" weight="semibold">{savedPrinter.name}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                    <ThemedText variant="caption" color={colors.success}>Tersimpan</ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.savedPrinterActions}>
                <TouchableOpacity onPress={testSavedPrinter} disabled={bleBusy} style={styles.iconBtn}><Ionicons name="play-outline" size={22} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={handleForgetPrinter} style={styles.iconBtn}><Ionicons name="trash-outline" size={22} color={colors.danger} /></TouchableOpacity>
              </View>
            </View>
          )}

          {!savedPrinter && (
            <View style={styles.noPrinterBox}>
              <Ionicons name="print-outline" size={48} color={colors.gray300} />
              <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>Belum ada printer tersimpan</ThemedText>
            </View>
          )}

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

          <ThemedText variant="body" weight="semibold" style={{ marginBottom: spacing.sm }}>Cari Printer Bluetooth Baru</ThemedText>
          <Button title={bleScanning ? 'Memindai...' : 'Pindai Printer'} onPress={scanBle} loading={bleScanning} variant={bleDevices.length > 0 ? 'outline' : 'primary'} />

          {bleScanning && (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText variant="body" color={colors.textSecondary} style={{ marginTop: spacing.md }}>Mencari printer Bluetooth...</ThemedText>
            </View>
          )}

          {!bleScanning && bleDevices.length > 0 && (
            <View style={{ marginTop: spacing.md, maxHeight: 220 }}>
              <ThemedText variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>Ditemukan {bleDevices.length} perangkat:</ThemedText>
              <FlatList data={bleDevices} keyExtractor={d => d.id} style={{ flexGrow: 0 }}
                renderItem={({ item }) => {
                  const isSaved = savedPrinter?.id === item.id;
                  return (
                    <View style={styles.bleDeviceRow}>
                      <Ionicons name="print-outline" size={22} color={isSaved ? colors.success : colors.gray400} />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}><ThemedText variant="body" weight="semibold">{item.name || 'Unknown'}</ThemedText></View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity onPress={() => connectAndTest(item)} disabled={bleBusy} style={[styles.miniBtn, { backgroundColor: colors.primaryLight }]}>
                          <Ionicons name="play" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        {!isSaved && (
                          <TouchableOpacity onPress={() => handleSavePrinter(item)} style={[styles.miniBtn, { backgroundColor: '#d4edda' }]}>
                            <Ionicons name="save-outline" size={16} color={colors.success} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          )}

          {!bleScanning && bleDevices.length === 0 && (
            <ThemedText variant="caption" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: spacing.md }}>Pastikan printer dalam mode pairing</ThemedText>
          )}
        </View></View>
      </Modal>

      {/* Plan Modal (superadmin) */}
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

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.gray400} />
        <ThemedText variant="body" color={colors.textSecondary}>{label}</ThemedText>
      </View>
      <ThemedText variant="body" weight="medium">{value || '-'}</ThemedText>
    </View>
  );
}

function TouchableRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.gray400} />
        <ThemedText variant="body">{label}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
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
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  name: { marginBottom: spacing.xs },
  section: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoutBtn: { marginTop: spacing.lg },
  subsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  subsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md },
  langItemActive: { backgroundColor: colors.primaryLight },
  aboutSection: { alignItems: 'center', paddingVertical: spacing.lg },
  bleDeviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  savedPrinterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, padding: spacing.md },
  savedPrinterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  printerIconWrap: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  savedPrinterActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  noPrinterBox: { alignItems: 'center', paddingVertical: spacing.lg },
  miniBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

  // Superadmin styles
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', padding: spacing.md },
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tabBtn: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.gray100, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  companyCard: { marginBottom: spacing.sm },
  companyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  companyInfo: { flex: 1 },
  companyMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  companyActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  planCard: { marginBottom: spacing.sm },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  planPrices: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm },
  planLimits: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  planActions: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
});
