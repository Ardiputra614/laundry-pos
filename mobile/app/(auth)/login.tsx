import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Email dan password wajib diisi' });
      return;
    }

    setLoading(true);
    try {
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
