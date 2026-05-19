import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { LoadingScreen } from '@/components/LoadingScreen';
import { colors, spacing, borderRadius, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import * as Print from 'expo-print';
import { scanPrinters, connectPrinter, disconnectPrinter, printESC, buildReceipt } from '@/lib/blePrinter';
import { getSavedPrinter, savePrinter, SavedPrinter } from '@/lib/printerStore';

const ORDER_STATUSES = ['pending', 'washing', 'drying', 'ironing', 'packing', 'finished', 'delivered'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printingQr, setPrintingQr] = useState(false);
  const [showBle, setShowBle] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [bleBusy, setBleBusy] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<SavedPrinter | null>(null);

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    const s = await getSavedPrinter();
    setSavedPrinter(s);
  };

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Gagal memuat pesanan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      Toast.show({ type: 'success', text1: 'Berhasil', text2: `Status diubah ke ${newStatus}` });
      fetchOrder();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || 'Gagal update status' });
    }
  };

  const handlePrintQr = async () => {
    if (!order) return;
    setPrintingQr(true);
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(order.invoice_number)}`;
      const html = `
      <html>
      <head>
        <style>
          body { font-family: monospace; text-align: center; padding: 20px; }
          h2 { margin-bottom: 20px; }
          img { width: 280px; height: 280px; }
          .inv { font-size: 18px; letter-spacing: 2px; margin-top: 10px; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <h2>QR Code Pesanan</h2>
        <img src="${qrUrl}" />
        <div class="inv">${order.invoice_number}</div>
        <div class="footer">Laundry POS - ${new Date().toLocaleDateString('id-ID')}</div>
      </body>
      </html>`;

      await Print.printAsync({ html });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal Print QR', text2: error.message });
    } finally {
      setPrintingQr(false);
    }
  };

  const printDirect = async () => {
    if (!savedPrinter) { scanBle(); return; }
    setBleBusy(true);
    try {
      const c = await connectPrinter(savedPrinter.id);
      const data = buildReceipt(order);
      await printESC(c, data);
      await disconnectPrinter(c);
      Toast.show({ type: 'success', text1: 'Berhasil', text2: `Struk terkirim ke ${savedPrinter.name}` });
    } catch (e: any) {
      Alert.alert('Cetak Gagal', `${e.message}\n\nIngin cari printer lain?`, [
        { text: 'Scan Ulang', onPress: scanBle },
        { text: 'Batal', style: 'cancel' },
      ]);
    }
    setBleBusy(false);
  };

  const scanBle = async () => {
    setScanning(true);
    setShowBle(true);
    setDevices([]);
    try {
      const d = await scanPrinters(8000);
      setDevices(d);
    } catch { setDevices([]); }
    setScanning(false);
  };

  const printBle = async (dev: any) => {
    setBleBusy(true);
    try {
      const c = await connectPrinter(dev.id);
      const data = buildReceipt(order);
      await printESC(c, data);
      await disconnectPrinter(c);
      setShowBle(false);
      Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Struk terkirim' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: e.message });
    }
    setBleBusy(false);
  };

  const handleSaveAndPrint = async (dev: any) => {
    await savePrinter({ id: dev.id, name: dev.name || 'Printer' });
    setSavedPrinter({ id: dev.id, name: dev.name || 'Printer' });
    await printBle(dev);
  };

  const handlePrint = async () => {
    if (!order) return;
    setPrinting(true);
    try {
      const itemsHtml = (order.items || []).map((item: any) =>
        `<tr><td>${item.service_name}</td><td>${item.quantity} ${item.unit}</td><td style="text-align:right">Rp ${(item.unit_price || 0).toLocaleString()}</td><td style="text-align:right">Rp ${(item.subtotal || 0).toLocaleString()}</td></tr>`
      ).join('');

      const html = `
      <html>
      <head>
        <style>
          body { font-family: monospace; font-size: 12px; padding: 20px; }
          h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
          h2 { text-align: center; font-size: 14px; margin-top: 0; color: #666; }
          .info { margin: 15px 0; }
          .info p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 6px 4px; border-bottom: 1px dashed #ccc; text-align: left; }
          th { border-bottom: 2px solid #333; }
          .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #999; border-top: 1px dashed #ccc; padding-top: 10px; }
          .qr { text-align: center; font-size: 20px; letter-spacing: 2px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>LAUNDRY POS</h1>
        <h2>${order.invoice_number}</h2>
        <div class="qr">${order.invoice_number}</div>
        <div class="info">
          <p><strong>Tgl Order:</strong> ${order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy HH:mm') : '-'}</p>
          <p><strong>Estimasi Selesai:</strong> ${order.estimated_done_at ? format(new Date(order.estimated_done_at), 'dd MMM yyyy HH:mm') : '-'}</p>
          <p><strong>Tipe:</strong> ${order.order_type} / ${order.service_type}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        <table>
          <tr><th>Layanan</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
          ${itemsHtml}
        </table>
        <div class="total">
          Total: Rp ${(order.grand_total || 0).toLocaleString()}
        </div>
        <p><strong>Pembayaran:</strong> ${order.payment_status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR'}</p>
        ${order.notes ? `<p><strong>Catatan:</strong> ${order.notes}</p>` : ''}
        <div class="footer">
          Terima kasih telah menggunakan layanan kami<br/>
          Laundry POS - ${new Date().toLocaleDateString('id-ID')}
        </div>
      </body>
      </html>`;

      await Print.printAsync({ html });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal Print', text2: error.message });
    } finally {
      setPrinting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!order) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText variant="body">Pesanan tidak ditemukan</ThemedText>
        <Button title="Kembali" onPress={() => router.back()} variant="outline" style={{ marginTop: spacing.md }} />
      </ThemedView>
    );
  }

  const currentStatusIndex = ORDER_STATUSES.indexOf(order.status);
  const isPaymentPending = order.payment_status === 'unpaid';

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText variant="title">{order.invoice_number}</ThemedText>
          <StatusBadge status={order.status} type="order" />
        </View>

        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Status Timeline</ThemedText>
          <View style={styles.timeline}>
            {ORDER_STATUSES.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              return (
                <View key={status} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <View style={[styles.dot, isCompleted && styles.dotCompleted, isCurrent && styles.dotCurrent]} />
                    {index < ORDER_STATUSES.length - 1 && (
                      <View style={[styles.line, isCompleted && styles.lineCompleted]} />
                    )}
                  </View>
                  <ThemedText
                    variant="body"
                    weight={isCurrent ? 'semibold' : 'regular'}
                    color={isCompleted ? colors.text : colors.gray400}
                    style={styles.timelineLabel}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </Card>

        {order.items && order.items.length > 0 && (
          <Card style={styles.section}>
            <ThemedText variant="heading" style={styles.sectionTitle}>Items</ThemedText>
            {order.items.map((item: any, index: number) => (
              <View key={index} style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}>
                <View style={styles.itemInfo}>
                  <ThemedText variant="body" weight="medium">{item.service_name}</ThemedText>
                  <ThemedText variant="caption">{item.quantity} {item.unit} × Rp {item.unit_price?.toLocaleString()}</ThemedText>
                </View>
                <ThemedText variant="body" weight="semibold">Rp {item.subtotal?.toLocaleString()}</ThemedText>
              </View>
            ))}
          </Card>
        )}

        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Pembayaran</ThemedText>
          <View style={styles.paymentRow}>
            <ThemedText variant="body">Status</ThemedText>
            <StatusBadge status={order.payment_status} type="payment" />
          </View>
          <View style={styles.paymentRow}>
            <ThemedText variant="body">Subtotal</ThemedText>
            <ThemedText variant="body">Rp {order.subtotal?.toLocaleString()}</ThemedText>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.paymentRow}>
              <ThemedText variant="body">Diskon</ThemedText>
              <ThemedText variant="body" color={colors.danger}>-Rp {order.discount_amount?.toLocaleString()}</ThemedText>
            </View>
          )}
          {order.tax_amount > 0 && (
            <View style={styles.paymentRow}>
              <ThemedText variant="body">Pajak</ThemedText>
              <ThemedText variant="body">Rp {order.tax_amount?.toLocaleString()}</ThemedText>
            </View>
          )}
          <View style={[styles.paymentRow, styles.totalRow]}>
            <ThemedText variant="heading">Total</ThemedText>
            <ThemedText variant="heading" color={colors.primary}>Rp {order.grand_total?.toLocaleString()}</ThemedText>
          </View>
          {order.paid_amount > 0 && (
            <View style={styles.paymentRow}>
              <ThemedText variant="body">Dibayar</ThemedText>
              <ThemedText variant="body" color={colors.success}>Rp {order.paid_amount?.toLocaleString()}</ThemedText>
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="heading" style={styles.sectionTitle}>Info Order</ThemedText>
          <InfoRow label="Tipe" value={order.order_type === 'dropoff' ? 'Antar Sendiri' : 'Pickup'} />
          <InfoRow label="Layanan" value={order.service_type === 'express' ? 'Ekspres' : 'Reguler'} />
          {order.total_weight > 0 && <InfoRow label="Berat" value={`${order.total_weight} kg`} />}
          <InfoRow label="Estimasi Selesai" value={order.estimated_done_at ? format(new Date(order.estimated_done_at), 'dd MMM yyyy HH:mm') : '-'} />
          <InfoRow label="Dibuat" value={order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy HH:mm') : '-'} />
          {order.completed_at && <InfoRow label="Selesai" value={format(new Date(order.completed_at), 'dd MMM yyyy HH:mm')} />}
          {order.notes && <InfoRow label="Catatan" value={order.notes} />}
        </Card>

        <View style={styles.actions}>
          {currentStatusIndex < ORDER_STATUSES.length - 1 && (
            <Button
              title={`Ubah ke ${ORDER_STATUSES[currentStatusIndex + 1].charAt(0).toUpperCase() + ORDER_STATUSES[currentStatusIndex + 1].slice(1)}`}
              onPress={() => handleStatusUpdate(ORDER_STATUSES[currentStatusIndex + 1])}
              size="lg"
            />
          )}
          {isPaymentPending && (
            <Button
              title="Tandai Dibayar"
              onPress={async () => {
                try {
                  await api.post(`/orders/${id}/payment`, { amount: order.grand_total, payment_method: 'cash', payment_channel: 'cash' });
                  Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Pembayaran dicatat' });
                  fetchOrder();
                } catch (error: any) {
                  Toast.show({ type: 'error', text1: 'Gagal', text2: 'Error processing payment' });
                }
              }}
              variant="outline"
              size="lg"
              style={{ marginTop: spacing.sm }}
            />
          )}
          <Button
            title="Cetak Struk"
            onPress={handlePrint}
            variant="outline"
            size="lg"
            style={{ marginTop: spacing.sm }}
            loading={printing}
          />
          <Button
            title="Cetak QR"
            onPress={handlePrintQr}
            variant="outline"
            size="lg"
            style={{ marginTop: spacing.sm }}
            loading={printingQr}
          />
          <Button
            title={savedPrinter ? `Cetak via ${savedPrinter.name}` : 'Cetak Bluetooth'}
            onPress={printDirect}
            variant="outline"
            size="lg"
            style={{ marginTop: spacing.sm }}
            loading={bleBusy}
          />
        </View>
      </ScrollView>

      <Modal visible={showBle} animationType="slide" transparent>
        <View style={styles.bleOv}>
          <View style={styles.bleSheet}>
            <View style={styles.bleHd}>
              <ThemedText variant="heading">Printer Bluetooth</ThemedText>
              <TouchableOpacity onPress={() => setShowBle(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {scanning && <ThemedText style={{ textAlign: 'center', margin: spacing.lg }} variant="body">Memindai...</ThemedText>}
            {!scanning && devices.length === 0 && (
              <View style={{ alignItems: 'center', padding: spacing.lg }}>
                <ThemedText variant="body" color={colors.textSecondary}>Tidak ada printer</ThemedText>
                <Button title="Scan Ulang" onPress={scanBle} variant="outline" size="sm" style={{ marginTop: spacing.md }} />
              </View>
            )}
            <FlatList
              data={devices}
              keyExtractor={d => d.id}
              style={{ flexGrow: 0 }}
              renderItem={({ item }) => {
                const isSaved = savedPrinter?.id === item.id;
                return (
                  <View style={styles.bleDev}>
                    <Ionicons name="print-outline" size={22} color={isSaved ? colors.success : colors.gray400} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <ThemedText variant="body" weight="semibold">{item.name || 'Unknown'}</ThemedText>
                      {isSaved && <ThemedText variant="caption" color={colors.success}>Printer utama</ThemedText>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => printBle(item)}
                        disabled={bleBusy}
                        style={[styles.miniBtn, { backgroundColor: colors.primaryLight }]}
                      >
                        <Ionicons name="print" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      {!isSaved && (
                        <TouchableOpacity
                          onPress={() => handleSaveAndPrint(item)}
                          style={[styles.miniBtn, { backgroundColor: '#d4edda' }]}
                        >
                          <Ionicons name="save-outline" size={16} color={colors.success} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText variant="body" color={colors.textSecondary}>{label}</ThemedText>
      <ThemedText variant="body" weight="medium" style={{ textTransform: 'capitalize' }}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  timeline: { paddingLeft: spacing.xs },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: -4 },
  timelineDot: { alignItems: 'center', width: 24, marginRight: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gray200, marginTop: 4 },
  dotCompleted: { backgroundColor: colors.primary },
  dotCurrent: { backgroundColor: colors.primary, width: 16, height: 16, borderRadius: 8, marginTop: 2 },
  line: { width: 2, flex: 1, backgroundColor: colors.gray200, marginVertical: 2, minHeight: 24 },
  lineCompleted: { backgroundColor: colors.primary },
  timelineLabel: { paddingVertical: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemInfo: { flex: 1 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs + 2 },
  actions: { marginTop: spacing.md, marginBottom: spacing.xl },
  bleOv: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  bleSheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg },
  bleHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  bleDev: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  miniBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
