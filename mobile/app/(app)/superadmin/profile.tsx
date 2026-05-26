import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBadge } from '@/components/StatusBadge';
import { useColors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

export default function SAProfileScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showChangePw, setShowChangePw] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { Toast.show({ type: 'error', text1: 'Gagal', text2: 'Password baru tidak cocok' }); return; }
    if (newPassword.length < 8) { Toast.show({ type: 'error', text1: 'Gagal', text2: 'Password minimal 8 karakter' }); return; }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
      Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Password diubah. Silakan login ulang.' });
      setShowChangePw(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); handleLogout();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    }
    setChangingPw(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Yakin ingin logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); }},
    ]);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.lg },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    name: { marginBottom: spacing.xs },
    section: { marginBottom: spacing.md },
    sectionTitle: { marginBottom: spacing.sm },
    logoutBtn: { marginTop: spacing.lg },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    aboutSection: { alignItems: 'center', paddingVertical: spacing.lg },
  }), [colors]);

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.white} />
          </View>
          <ThemedText variant="title" style={styles.name}>{user?.full_name}</ThemedText>
          <ThemedText variant="body" color={colors.textSecondary}>{user?.email}</ThemedText>
          {user?.role && <StatusBadge status={user.role} />}
        </View>

        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Info Akun</ThemedText>
          <InfoRow icon="person-outline" label="Nama" value={user?.full_name} />
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Pengaturan</ThemedText>
          <TouchableRow icon="lock-closed-outline" label="Ubah Password" onPress={() => setShowChangePw(true)} />
          <TouchableRow icon="information-circle-outline" label="Tentang" onPress={() => setShowAbout(true)} />
        </Card>

        <Button title="Logout" onPress={handleLogout} variant="danger" size="lg" style={styles.logoutBtn} />
      </ScrollView>

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

function TouchableRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[helperStyles.row, helperStyles.rowBorder]} onPress={onPress}>
      <View style={helperStyles.rowLeft}>
        <Ionicons name={icon as any} size={20} color={colors.gray400} />
        <ThemedText variant="body">{label}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

const helperStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});


