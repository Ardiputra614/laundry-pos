import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Switch } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useColors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const colors = useColors();
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState('');
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      const s = data.data || {};
      setTaxEnabled(s.tax_enabled || false);
      setDefaultTaxRate(s.default_tax_rate?.toString() || '');
      setDiscountEnabled(s.discount_enabled || false);
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', {
        tax_enabled: taxEnabled,
        default_tax_rate: parseFloat(defaultTaxRate) || 0,
        discount_enabled: discountEnabled,
      });
      Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Pengaturan disimpan' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    }
    setSaving(false);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { marginBottom: spacing.lg },
    section: { marginBottom: spacing.md },
    sectionTitle: { marginBottom: spacing.sm },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
    settingInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  }), [colors]);

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText variant="title">Pajak & Diskon</ThemedText>
        </View>

        <Card style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="receipt-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="body" weight="semibold">Pajak (PPN)</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>Aktifkan pajak otomatis di pesanan baru</ThemedText>
              </View>
            </View>
            <Switch
              value={taxEnabled}
              onValueChange={setTaxEnabled}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={taxEnabled ? colors.primary : colors.gray400}
            />
          </View>

          {taxEnabled && (
            <Input
              label="Persentase Pajak (%)"
              placeholder="11"
              value={defaultTaxRate}
              onChangeText={setDefaultTaxRate}
              keyboardType="numeric"
              icon="calculator-outline"
            />
          )}
        </Card>

        <Card style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="trending-down-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText variant="body" weight="semibold">Diskon Layanan</ThemedText>
                <ThemedText variant="caption" color={colors.textSecondary}>Aktifkan diskon per layanan (%)</ThemedText>
              </View>
            </View>
            <Switch
              value={discountEnabled}
              onValueChange={setDiscountEnabled}
              trackColor={{ false: colors.gray300, true: colors.primaryLight }}
              thumbColor={discountEnabled ? colors.primary : colors.gray400}
            />
          </View>
        </Card>

        <Button title="Simpan" onPress={handleSave} size="lg" loading={saving} />
      </ScrollView>
    </ThemedView>
  );
}


