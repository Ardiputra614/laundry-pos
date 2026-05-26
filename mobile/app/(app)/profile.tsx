import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBadge } from '@/components/StatusBadge';
import { useColors, useThemeStore, spacing, borderRadius } from '@/lib/theme';
import { useI18nStore } from '@/stores/i18nStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { t, Language } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import { scanPrinters, connectPrinter, disconnectPrinter, printESC, buildReceipt } from '@/lib/blePrinter';
import { savePrinter, getSavedPrinter, removeSavedPrinter, SavedPrinter } from '@/lib/printerStore';

export default function ProfileScreen() {
  const colors = useColors();
  const { isDark, toggleTheme } = useThemeStore();
  const { language, setLanguage } = useI18nStore();
  const { status: subStatus } = useSubscriptionStore();
  const { user, logout } = useAuth();
  const isPending = subStatus === 'pending';
  const isActive = subStatus === 'active' || subStatus === 'trial';
  const router = useRouter();

  const [subscription, setSubscription] = useState<any>(null);

  // Settings modals
  const [showChangePw, setShowChangePw] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrinter, setShowPrinter] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Printer
  const [bleScanning, setBleScanning] = useState(false);
  const [bleDevices, setBleDevices] = useState<any[]>([]);
  const [bleBusy, setBleBusy] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<SavedPrinter | null>(null);
  const [bleConnected, setBleConnected] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try { const { data } = await api.get('/subscription'); setSubscription(data.data); } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscription();
    setRefreshing(false);
  };

  // ---- Printer ----
  React.useEffect(() => { if (showPrinter) {
    if (isPending) { setShowPrinter(false); return; }
    loadSaved();
  } }, [showPrinter]);
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

  const styles = React.useMemo(() => StyleSheet.create({
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    name: { marginBottom: spacing.xs },
    section: { marginBottom: spacing.md },
    sectionTitle: { marginBottom: spacing.sm },
    logoutBtn: { marginTop: spacing.lg },
    subsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    subsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    aboutSection: { alignItems: 'center', paddingVertical: spacing.lg },
    savedPrinterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, padding: spacing.md },
    savedPrinterLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
    printerIconWrap: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    savedPrinterActions: { flexDirection: 'row', gap: spacing.xs },
    iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
    noPrinterBox: { alignItems: 'center', paddingVertical: spacing.lg },
    bleDeviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    miniBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    langBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray100 },
    langBtnActive: { backgroundColor: colors.primary },
  }), [colors]);

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

        {/* === SUBSCRIPTION INFO === */}
        {subscription && (
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
        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Info Akun</ThemedText>
          <InfoRow icon="person-outline" label="Nama" value={user?.full_name} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="call-outline" label="Telepon" value={user?.phone} />
          <InfoRow icon="shield-checkmark-outline" label="Role" value={user?.role} />
        </Card>

        {/* === SUBSCRIPTION MENU === */}
        <Card style={styles.section}>
          <TouchableRow icon="diamond-outline" label="Langganan & Paket" onPress={() => router.push('/(app)/subscription' as any)} />
        </Card>

        {/* === SETTINGS === */}
        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Pengaturan</ThemedText>
          <TouchableRow icon="lock-closed-outline" label="Ubah Password" onPress={() => setShowChangePw(true)} />
          <TouchableRow icon="language-outline" label="Bahasa" onPress={() => setShowLanguage(true)} />
          <TouchableRow icon={isDark ? 'moon-outline' : 'sunny-outline'} label="Tampilan" onPress={() => setShowTheme(true)} />
          <TouchableRow icon="settings-outline" label="Pajak & Diskon" onPress={() => isPending ? router.push('/(app)/subscription' as any) : router.push('/(app)/settings' as any)} locked={isPending} />
          <TouchableRow icon="print-outline" label="Printer Struk" onPress={() => isPending ? router.push('/(app)/subscription' as any) : setShowPrinter(true)} locked={isPending} />
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
            <ThemedText variant="heading">Bahasa</ThemedText>
            <TouchableOpacity onPress={() => setShowLanguage(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'id' && styles.langBtnActive]}
              onPress={() => { setLanguage('id'); setShowLanguage(false); }}
            >
              <Ionicons name="language-outline" size={22} color={language === 'id' ? colors.white : colors.text} />
              <ThemedText variant="body" weight="semibold" color={language === 'id' ? colors.white : colors.text}>Indonesia</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
              onPress={() => { setLanguage('en'); setShowLanguage(false); }}
            >
              <Ionicons name="language-outline" size={22} color={language === 'en' ? colors.white : colors.text} />
              <ThemedText variant="body" weight="semibold" color={language === 'en' ? colors.white : colors.text}>English</ThemedText>
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      {/* Theme */}
      <Modal visible={showTheme} animationType="slide" transparent>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText variant="heading">Tampilan</ThemedText>
            <TouchableOpacity onPress={() => setShowTheme(false)}><Ionicons name="close" size={24} color={colors.text} /></TouchableOpacity>
          </View>
          <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
            <TouchableOpacity
              style={[styles.langBtn, !isDark && styles.langBtnActive]}
              onPress={() => { useThemeStore.getState().setTheme(false); setShowTheme(false); }}
            >
              <Ionicons name="sunny-outline" size={22} color={!isDark ? colors.white : colors.text} />
              <ThemedText variant="body" weight="semibold" color={!isDark ? colors.white : colors.text}>Terang</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, isDark && styles.langBtnActive]}
              onPress={() => { useThemeStore.getState().setTheme(true); setShowTheme(false); }}
            >
              <Ionicons name="moon-outline" size={22} color={isDark ? colors.white : colors.text} />
              <ThemedText variant="body" weight="semibold" color={isDark ? colors.white : colors.text}>Gelap</ThemedText>
            </TouchableOpacity>
          </View>
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
    </ThemedView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  const colors = useColors();
  return (
    <View style={[helperStyles.row, helperStyles.rowBorder]}>
      <View style={helperStyles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.gray400} />
        <ThemedText variant="body" color={colors.textSecondary}>{label}</ThemedText>
      </View>
      <ThemedText variant="body" weight="medium">{value || '-'}</ThemedText>
    </View>
  );
}

function TouchableRow({ icon, label, onPress, locked }: { icon: string; label: string; onPress: () => void; locked?: boolean }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[helperStyles.row, helperStyles.rowBorder, locked && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={false}
    >
      <View style={helperStyles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.gray400} />
        <ThemedText variant="body">{label}</ThemedText>
        {locked && <Ionicons name="lock-closed" size={14} color={colors.danger} />}
      </View>
      <Ionicons name={locked ? 'lock-closed' : 'chevron-forward'} size={20} color={colors.warning} />
    </TouchableOpacity>
  );
}

const helperStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});


