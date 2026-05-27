import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useColors, spacing, borderRadius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { dbOrders, dbServices, dbSyncQueue } from '@/lib/database';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import Toast from 'react-native-toast-message';

interface ServiceOption {
  id: string;
  name: string;
  unit: string;
  base_price: number;
  discount_percent: number;
}

interface ManualService {
  name: string;
  quantity: string;
  unit: string;
  unit_price: string;
  discount_percent: number;
}

const emptyForm = () => ({
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  items: [] as ManualService[],
  notes: '',
  orderType: 'dropoff' as 'dropoff' | 'pickup',
  serviceType: 'regular' as 'regular' | 'express',
});

export default function POSScreen() {
  const colors = useColors();
  const router = useRouter();
  const { clearCurrentOrder } = useOrderStore();
  const { tenantId, companyId } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<number | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<ManualService[]>([]);
  const [notes, setNotes] = useState('');
  const [orderType, setOrderType] = useState<'dropoff' | 'pickup'>('dropoff');
  const [serviceType, setServiceType] = useState<'regular' | 'express'>('regular');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(false);

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setItems([]);
    setNotes('');
    setOrderType('dropoff');
    setServiceType('regular');
  };

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [svcRes, setRes] = await Promise.all([
          api.get('/services?limit=200'),
          api.get('/settings'),
        ]);
        const svcData = svcRes.data.data || [];
        setServices(svcData);
        svcData.forEach((s: any) => dbServices.upsert(s).catch(() => {}));

        const s = setRes.data.data || {};
        setTaxEnabled(s.tax_enabled || false);
        setDefaultTaxRate(s.default_tax_rate || 0);
        setDiscountEnabled(s.discount_enabled || false);
      } catch {
        const local = await dbServices.getAll();
        setServices(local);
      }
    })();
  }, []));

  const addRow = () => {
    setItems([...items, { name: '', quantity: '1', unit: 'kg', unit_price: '', discount_percent: 0 }]);
  };

  const updateRow = (index: number, field: keyof ManualService, value: string) => {
    setItems(items.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const pickService = (svc: ServiceOption) => {
    if (pickerTarget !== null) {
      const updated = items.map((s, i) =>
        i === pickerTarget
          ? { ...s, name: svc.name, unit: svc.unit, unit_price: svc.base_price.toString(), discount_percent: svc.discount_percent || 0 }
          : s
      );
      setItems(updated);
      setPickerTarget(null);
    }
    setShowServicePicker(false);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, s) => {
      const qty = parseFloat(s.quantity) || 0;
      const price = parseFloat(s.unit_price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!discountEnabled) return 0;
    return items.reduce((sum, s) => {
      const qty = parseFloat(s.quantity) || 0;
      const price = parseFloat(s.unit_price) || 0;
      const pct = s.discount_percent || 0;
      return sum + qty * price * (pct / 100);
    }, 0);
  };

  const getTax = () => {
    if (!taxEnabled) return 0;
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const net = subtotal - discount;
    return net * (defaultTaxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = getTax();
    return Math.max(0, subtotal - discount + tax);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Nama pelanggan wajib diisi' });
      return;
    }
    if (!customerPhone.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Nomor WA pelanggan wajib diisi' });
      return;
    }

    const validItems = items.filter((s) => s.name.trim() && parseFloat(s.unit_price) > 0);
    if (validItems.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Minimal satu layanan dengan harga harus diisi' });
      return;
    }

    setLoading(true);
    try {
      const orderId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

      const orderItems = validItems.map((s) => ({
        service_name: s.name,
        quantity: parseFloat(s.quantity) || 1,
        unit: s.unit || 'kg',
        unit_price: parseFloat(s.unit_price) || 0,
        subtotal: (parseFloat(s.quantity) || 1) * (parseFloat(s.unit_price) || 0),
        notes: '',
      }));

      const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
      const discountVal = calculateDiscount();
      const taxVal = getTax();
      const grandTotal = Math.max(0, subtotal - discountVal + taxVal);

      const orderPayload = {
        customer_id: orderId,
        order_type: orderType,
        service_type: serviceType,
        items: orderItems,
        discount_amount: discountVal,
        tax_amount: taxVal,
        notes,
      };

      const localOrder = {
        id: orderId,
        tenant_id: tenantId || '',
        company_id: companyId || '',
        customer_id: orderId,
        invoice_number: `OFFLINE-${orderId.slice(0, 8).toUpperCase()}`,
        status: 'pending',
        order_type: orderType,
        service_type: serviceType,
        subtotal,
        discount_amount: discountVal,
        tax_amount: taxVal,
        grand_total: grandTotal,
        payment_status: 'unpaid',
        items: orderItems,
        notes,
        created_at: new Date().toISOString(),
      };

      const orderPayloadWithMeta = {
        ...orderPayload,
        tenant_id: tenantId || '',
        company_id: companyId || '',
      };

      try {
        await api.post('/orders', orderPayload);
        dbOrders.upsert(localOrder, 'synced');
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Pesanan berhasil dibuat' });
      } catch {
        dbOrders.upsert(localOrder, 'pending');
        dbSyncQueue.add('orders', 'create', orderId, orderPayloadWithMeta);
        Toast.show({ type: 'success', text1: 'Disimpan Offline', text2: 'Pesanan akan tersimpan dan tersinkron nanti' });
      }

      clearCurrentOrder();
      resetForm();
      router.push('/(app)/orders');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    } finally {
      setLoading(false);
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    scrollView: { flex: 1 },
    content: { padding: spacing.md, paddingBottom: 100 },
    header: { marginBottom: spacing.md },
    section: { marginBottom: spacing.md },
    sectionTitle: { marginBottom: spacing.sm },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, alignItems: 'flex-start' },
    removeBtn: { paddingTop: spacing.lg + spacing.xs },
    serviceFields: { flex: 1 },
    inlineFields: { flexDirection: 'row', gap: spacing.sm },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    typeBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray100, alignItems: 'center' },
    typeBtnActive: { backgroundColor: colors.primary },
    submitBtn: { marginTop: spacing.md },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
    pickerOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '60%' },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  }), [colors]);

  return (
    <ThemedView>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText variant="title">Pesanan Baru</ThemedText>
          </View>

          <Card style={styles.section}>
            <ThemedText variant="heading" style={styles.sectionTitle}>Data Pelanggan</ThemedText>
            <Input label="Nama Lengkap *" placeholder="Masukkan nama pelanggan" value={customerName} onChangeText={setCustomerName} icon="person-outline" />
            <Input label="No. WhatsApp *" placeholder="08xxxxxxxxxx" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" icon="logo-whatsapp" />
            <Input label="Alamat" placeholder="Masukkan alamat (opsional)" value={customerAddress} onChangeText={setCustomerAddress} icon="location-outline" />
          </Card>

          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="heading" style={styles.sectionTitle}>Layanan</ThemedText>
              <TouchableOpacity onPress={() => setShowServicePicker(true)}>
                <Ionicons name="add-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {items.length === 0 && (
              <ThemedText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                Tambahkan layanan dengan menekan tombol +
              </ThemedText>
            )}

            {items.map((svc, index) => (
              <View key={index} style={styles.serviceRow}>
                <TouchableOpacity onPress={() => removeRow(index)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
                <View style={styles.serviceFields}>
                  <Input label="Nama Layanan" placeholder="Cuci Kering, Setrika, dll" value={svc.name} onChangeText={(v) => updateRow(index, 'name', v)} icon="pricetag-outline" />
                  <View style={styles.inlineFields}>
                    <View style={{ flex: 1 }}><Input label="Qty" placeholder="1" value={svc.quantity} onChangeText={(v) => updateRow(index, 'quantity', v)} keyboardType="numeric" /></View>
                    <View style={{ flex: 1 }}><Input label="Satuan" placeholder="kg" value={svc.unit} onChangeText={(v) => updateRow(index, 'unit', v)} /></View>
                  </View>
                  <Input label="Harga Satuan" placeholder="0" value={svc.unit_price} onChangeText={(v) => updateRow(index, 'unit_price', v)} keyboardType="numeric" />
                </View>
              </View>
            ))}
          </Card>

          {items.filter((s) => s.name.trim() && parseFloat(s.unit_price) > 0).length > 0 && (
            <Card style={styles.section}>
              <ThemedText variant="heading" style={styles.sectionTitle}>Ringkasan Biaya</ThemedText>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <ThemedText variant="body" color={colors.textSecondary}>Subtotal</ThemedText>
                <ThemedText variant="body">Rp {calculateSubtotal().toLocaleString()}</ThemedText>
              </View>
              {calculateDiscount() > 0 && (
                <View style={styles.totalRow}>
                  <ThemedText variant="body" color={colors.danger}>Diskon Layanan</ThemedText>
                  <ThemedText variant="body" color={colors.danger}>- Rp {calculateDiscount().toLocaleString()}</ThemedText>
                </View>
              )}
              {getTax() > 0 && (
                <View style={styles.totalRow}>
                  <ThemedText variant="body" color={colors.textSecondary}>Pajak ({defaultTaxRate}%)</ThemedText>
                  <ThemedText variant="body">+ Rp {getTax().toLocaleString()}</ThemedText>
                </View>
              )}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <ThemedText variant="heading">Total</ThemedText>
                <ThemedText variant="heading" color={colors.primary}>Rp {calculateTotal().toLocaleString()}</ThemedText>
              </View>
            </Card>
          )}

          <Card style={styles.section}>
            <ThemedText variant="heading" style={styles.sectionTitle}>Tipe Pesanan</ThemedText>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, orderType === 'dropoff' && styles.typeBtnActive]} onPress={() => setOrderType('dropoff')}>
                <ThemedText color={orderType === 'dropoff' ? colors.white : colors.text}>Antar Sendiri</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, orderType === 'pickup' && styles.typeBtnActive]} onPress={() => setOrderType('pickup')}>
                <ThemedText color={orderType === 'pickup' ? colors.white : colors.text}>Pickup</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, serviceType === 'regular' && styles.typeBtnActive]} onPress={() => setServiceType('regular')}>
                <ThemedText color={serviceType === 'regular' ? colors.white : colors.text}>Reguler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, serviceType === 'express' && styles.typeBtnActive]} onPress={() => setServiceType('express')}>
                <ThemedText color={serviceType === 'express' ? colors.white : colors.text}>Ekspres</ThemedText>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.section}>
            <Input label="Catatan" placeholder="Catatan tambahan (opsional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          </Card>

          <Button title="Buat Pesanan" onPress={handleSubmit} size="lg" style={styles.submitBtn} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showServicePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <ThemedText variant="heading">Pilih Layanan</ThemedText>
              <TouchableOpacity onPress={() => { setShowServicePicker(false); setPickerTarget(null); }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 500 }}>
              {services.filter((s) => s.base_price > 0).map((svc) => (
                <TouchableOpacity key={svc.id} style={styles.pickerItem} onPress={() => {
                  const newItems = [...items, { name: svc.name, quantity: '1', unit: svc.unit, unit_price: svc.base_price.toString(), discount_percent: svc.discount_percent || 0 }];
                  setItems(newItems);
                  setShowServicePicker(false);
                }}>
                  <View>
                    <ThemedText variant="body" weight="medium">{svc.name}</ThemedText>
                    <ThemedText variant="caption" color={colors.textSecondary}>{svc.unit} • Rp {svc.base_price.toLocaleString()}</ThemedText>
                  </View>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
              {services.filter((s) => s.base_price > 0).length === 0 && (
                <ThemedText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', padding: spacing.lg }}>
                  Belum ada layanan. Admin company harus menambah layanan dulu.
                </ThemedText>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </ThemedView>
  );
}


