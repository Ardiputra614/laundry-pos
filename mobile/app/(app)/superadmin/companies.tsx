import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

export default function CompaniesScreen() {
  const colors = useColors();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/superadmin/companies?limit=50');
      setCompanies(data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompanies();
    setRefreshing(false);
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
              fetchCompanies();
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
            }
          },
        },
      ]
    );
  };

  const styles = React.useMemo(() => StyleSheet.create({
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    companyCard: { marginBottom: spacing.sm },
    companyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    companyInfo: { flex: 1 },
    companyMeta: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
    companyActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {companies.map((company) => (
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
              <Button
                title={company.is_suspended ? 'Aktifkan' : 'Nonaktifkan'}
                variant={company.is_suspended ? 'outline' : 'danger'}
                size="sm"
                onPress={() => handleSuspend(company)}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
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


