import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/lib/theme';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Nama, email, dan password wajib diisi' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Password tidak cocok' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Password minimal 6 karakter' });
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, full_name: fullName, phone });
      router.replace('/(app)');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan';
      let detail = msg;
      if (msg === 'email already exists') detail = 'Email sudah terdaftar, gunakan email lain';
      else if (msg === 'conflict') detail = 'Email sudah terdaftar';
      else if (msg === 'validation error') detail = 'Data yang dimasukkan tidak valid';
      Toast.show({ type: 'error', text1: 'Daftar Gagal', text2: detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText variant="hero">Daftar Akun</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary}>Daftarkan perusahaan Anda</ThemedText>
          </View>

          <View style={styles.form}>
            <Input label="Nama Lengkap" placeholder="Masukkan nama" value={fullName} onChangeText={setFullName} icon="person-outline" />
            <Input label="Email" placeholder="Masukkan email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" />
            <Input label="No. HP" placeholder="Masukkan nomor HP" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" />
            <Input label="Password" placeholder="Buat password" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />
            <Input label="Konfirmasi Password" placeholder="Ulangi password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry icon="lock-closed-outline" />
            <Button title="Daftar" onPress={handleRegister} loading={loading} size="lg" style={styles.button} />
          </View>

          <View style={styles.footer}>
            <ThemedText variant="body" color={colors.textSecondary}>Sudah punya akun? </ThemedText>
            <Button title="Masuk" onPress={() => router.push('/(auth)/login')} variant="ghost" size="sm" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  form: { width: '100%' },
  button: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
});
