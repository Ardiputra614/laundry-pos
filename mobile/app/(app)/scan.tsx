import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { colors, spacing } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import Toast from 'react-native-toast-message';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText variant="body">Memuat...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <Ionicons name="camera-outline" size={64} color={colors.gray400} />
        <ThemedText variant="body" style={{ marginTop: spacing.md }}>Izin kamera diperlukan</ThemedText>
        <TouchableOpacity style={styles.permitBtn} onPress={requestPermission}>
          <ThemedText color={colors.white}>Berikan Izin</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: spacing.md }} onPress={() => router.back()}>
          <ThemedText color={colors.primary}>Kembali</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const invoice = data.trim();
      const { data: res } = await api.get(`/orders?limit=1&search=${encodeURIComponent(invoice)}`);
      const order = res.data?.[0];
      if (order) {
        router.replace(`/(app)/order/${order.id}`);
      } else {
        Toast.show({ type: 'error', text1: 'Tidak Ditemukan', text2: `Order ${invoice} tidak ditemukan` });
        setScanned(false);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Gagal mencari order' });
      setScanned(false);
    }
  };

  return (
    <ThemedView>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <ThemedText variant="body" color={colors.white} style={{ marginTop: spacing.lg }}>
              Arahkan kamera ke QR Code
            </ThemedText>
          </View>
          {scanned && (
            <TouchableOpacity style={styles.scanAgain} onPress={() => setScanned(false)}>
              <ThemedText color={colors.white}>Scan Lagi</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  permitBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 8, marginTop: spacing.md },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', padding: spacing.md },
  closeBtn: { alignSelf: 'flex-start', padding: spacing.sm, marginTop: spacing.xl },
  scanArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: colors.white, borderRadius: 16, backgroundColor: 'transparent' },
  scanAgain: { alignSelf: 'center', padding: spacing.md, marginBottom: spacing.xxl },
});
