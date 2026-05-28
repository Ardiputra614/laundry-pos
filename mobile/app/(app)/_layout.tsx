import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Modal } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, spacing, borderRadius } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { NetworkIndicator } from '@/components/NetworkIndicator';

function ScanButton(props: any) {
  const colors = useColors();
  const router = useRouter();
  const { status, loading } = useSubscriptionStore();
  const isLocked = !loading && status !== 'active';
  const scanStyles = React.useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={() => {
        if (isLocked) { router.push('/(app)/subscription'); return; }
        props.onPress?.();
      }}
      style={[scanStyles.scanBtn, isLocked && { opacity: 0.5 }]}
      activeOpacity={0.8}
    >
      <Ionicons name="qr-code-outline" size={26} color={colors.white} />
    </TouchableOpacity>
  );
}

function LockableTabIcon({ children, onPress, locked }: { children: React.ReactNode; onPress?: () => void; locked?: boolean }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        if (locked) { router.push('/(app)/subscription'); return; }
        onPress?.();
      }}
      style={{ alignItems: 'center', justifyContent: 'center', opacity: locked ? 0.5 : 1 }}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function AppLayout() {
  const colors = useColors();
  const { user } = useAuth();
  const { status, loading: subLoading, daysUntilExpiry } = useSubscriptionStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isSuperadmin = user?.role === 'superadmin';
  const isLocked = !subLoading && (status === 'pending' || status === 'none');
  const isExpiringSoon = !isLocked && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
  const [showSubModal, setShowSubModal] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  useEffect(() => {
    if (isSuperadmin) return;
    if (!subLoading && isLocked) {
      setShowSubModal(true);
      setShowExpiryWarning(false);
    } else if (!subLoading && isExpiringSoon && daysUntilExpiry !== null && daysUntilExpiry >= 0) {
      setShowExpiryWarning(true);
    }
  }, [subLoading, isLocked, isExpiringSoon, daysUntilExpiry, isSuperadmin]);

  return (
    <>
      <View style={{ position: 'absolute', top: 8, right: 12, zIndex: 999 }}>
        <NetworkIndicator />
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray400,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 4,
            height: 60 + insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        {/* Regular user tabs — hidden for superadmin, scan & report locked when pending */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="pos"
          options={{
            title: 'POS',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="qr-code-outline" size={size} color={color} />,
            ...(isSuperadmin ? {} : {
              tabBarButton: isLocked
                ? (props: any) => <LockableTabIcon locked onPress={props.onPress}>{props.children}</LockableTabIcon>
                : (props: any) => <ScanButton onPress={props.onPress} />,
            }),
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: 'Services',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'Report',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
            ...(isSuperadmin ? {} : {
              tabBarButton: isLocked
                ? (props: any) => <LockableTabIcon locked onPress={props.onPress}>{props.children}</LockableTabIcon>
                : undefined,
            }),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'More',
            href: isSuperadmin ? null : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />,
          }}
        />

        {/* Superadmin tabs */}
        <Tabs.Screen
          name="superadmin/overview"
          options={{
            title: 'Overview',
            href: isSuperadmin ? undefined : null,
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="superadmin/companies"
          options={{
            title: 'List',
            href: isSuperadmin ? undefined : null,
            tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="superadmin/plans"
          options={{
            title: 'Paket',
            href: isSuperadmin ? undefined : null,
            tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="superadmin/profile"
          options={{
            title: 'Profile',
            href: isSuperadmin ? undefined : null,
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />

        {/* Hidden screens */}
        <Tabs.Screen
          name="subscription"
          options={{
            href: null,
            title: 'Subscription',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            title: 'Settings',
          }}
        />
        <Tabs.Screen
          name="order/[id]"
          options={{
            href: null,
            title: 'Order Detail',
          }}
        />
      </Tabs>

      {/* Expiry warning modal - 3 days before */}
      <Modal visible={showExpiryWarning && daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0} animationType="fade" transparent>
        <View style={styles.subModalOverlay}>
          <Card style={styles.subModalCard}>
            <Ionicons name="warning-outline" size={48} color="#F59E0B" style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <ThemedText variant="heading" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
              Langganan Akan Berakhir
            </ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              {daysUntilExpiry === 0
                ? 'Langganan Anda berakhir hari ini. Perpanjang sekarang untuk terus menggunakan semua fitur.'
                : daysUntilExpiry === 1
                  ? 'Langganan Anda akan berakhir besok. Perpanjang sekarang untuk terus menggunakan semua fitur.'
                  : `Langganan Anda akan berakhir dalam ${daysUntilExpiry} hari. Perpanjang sekarang untuk terus menggunakan semua fitur.`}
            </ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              Perpanjangan harus dilakukan saat online.
            </ThemedText>
            <Button title="Perpanjang Langganan" onPress={() => { setShowExpiryWarning(false); router.push('/(app)/subscription'); }} size="lg" />
            <Button
              title="Nanti"
              onPress={() => setShowExpiryWarning(false)}
              variant="ghost"
              size="md"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </View>
      </Modal>

      {/* Subscription required modal */}
      <Modal visible={showSubModal} animationType="fade" transparent>
        <View style={styles.subModalOverlay}>
          <Card style={styles.subModalCard}>
            <Ionicons name="diamond-outline" size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
            <ThemedText variant="heading" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
              Langganan Diperlukan
            </ThemedText>
            <ThemedText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              Pilih paket dan selesaikan pembayaran untuk mengaktifkan semua fitur.
            </ThemedText>
            <Button title="Pilih Paket" onPress={() => { setShowSubModal(false); router.push('/(app)/subscription'); }} size="lg" />
            <Button
              title="Nanti"
              onPress={() => setShowSubModal(false)}
              variant="ghost"
              size="md"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  subModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.lg,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 340,
    padding: spacing.lg,
    alignItems: 'center',
  },
});

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scanBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      elevation: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
  });
}
