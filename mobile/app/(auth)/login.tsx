import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useColors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

const SAVED_EMAIL_KEY = 'saved_email';
const SAVED_PASSWORD_KEY = 'saved_password';

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const savedEmail = await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
      const savedPassword = await SecureStore.getItemAsync(SAVED_PASSWORD_KEY);
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) { setPassword(savedPassword); setRemember(true); }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Email dan password wajib diisi' });
      return;
    }

    setLoading(true);
    try {
      if (remember) {
        await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email);
        await SecureStore.setItemAsync(SAVED_PASSWORD_KEY, password);
      } else {
        await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
        await SecureStore.deleteItemAsync(SAVED_PASSWORD_KEY);
      }
      await login(email, password);
      router.replace('/(app)');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan';
      let detail = msg;
      if (msg === 'unauthorized') detail = 'Email atau password salah';
      else if (msg === 'company is suspended') detail = 'Akun perusahaan Anda telah dinonaktifkan';
      else if (msg === 'forbidden') detail = 'Akses ditolak';
      Toast.show({ type: 'error', text1: 'Login Gagal', text2: detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="shirt-outline" size={64} color={colors.primary} />
            <ThemedText variant="hero" style={styles.title}>Laundry POS</ThemedText>
            <ThemedText variant="body" color={colors.textSecondary}>Masuk ke akun Anda</ThemedText>
          </View>

          <View style={styles.form}>
            <Input label="Email" placeholder="Masukkan email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" />
            <Input label="Password" placeholder="Masukkan password" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />

            <View style={styles.rememberRow}>
              <Switch
                value={remember}
                onValueChange={setRemember}
                trackColor={{ false: colors.gray300, true: colors.primaryLight }}
                thumbColor={remember ? colors.primary : colors.gray400}
              />
              <ThemedText variant="body" color={colors.textSecondary}>Ingat saya</ThemedText>
            </View>

            <Button title="Masuk" onPress={handleLogin} loading={loading} size="lg" style={styles.button} />
          </View>

          <View style={styles.footer}>
            <ThemedText variant="body" color={colors.textSecondary}>Belum punya akun?{' '}</ThemedText>
            <Button title="Daftar" onPress={() => router.push('/(auth)/register')} variant="ghost" size="sm" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
