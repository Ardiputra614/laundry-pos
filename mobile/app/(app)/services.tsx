import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useColors, spacing, borderRadius, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { dbServices, dbCategories } from '@/lib/database';
import { useI18nStore } from '@/stores/i18nStore';
import { t } from '@/lib/i18n';
import Toast from 'react-native-toast-message';

interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_type: 'weight' | 'piece';
  unit: string;
  base_price: number;
  discount_percent: number;
  min_quantity: number;
  estimated_hours: number;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export default function ServicesScreen() {
  const colors = useColors();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriceType, setFormPriceType] = useState<'weight' | 'piece'>('weight');
  const [formUnit, setFormUnit] = useState('kg');
  const [formPrice, setFormPrice] = useState('');
  const [formHours, setFormHours] = useState('24');
  const [formDiscount, setFormDiscount] = useState('');
  const [saving, setSaving] = useState(false);
  const language = useI18nStore((s) => s.language);

  const fetchData = async () => {
    try {
      const [svcRes, catRes] = await Promise.all([
        api.get('/services?limit=100'),
        api.get('/services/categories'),
      ]);
      const svcData = svcRes.data.data || [];
      const catData = catRes.data.data || [];
      setServices(svcData);
      setCategories(catData);
      svcData.forEach((s: any) => dbServices.upsert(s));
      dbCategories.clear();
      catData.forEach((c: any) => dbCategories.upsert(c));
    } catch {
      const [local, localCats] = await Promise.all([
        dbServices.getAll(),
        dbCategories.getAll(),
      ]);
      setServices(local);
      setCategories(localCats);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormCategory(categories[0]?.id || '');
    setFormPriceType('weight');
    setFormUnit('kg');
    setFormPrice('');
    setFormHours('24');
    setFormDiscount('');
    setShowModal(true);
  };

  const openEdit = (svc: ServiceItem) => {
    setEditing(svc);
    setFormName(svc.name);
    setFormCategory(svc.category_id);
    setFormPriceType(svc.price_type);
    setFormUnit(svc.unit);
    setFormPrice(svc.base_price.toString());
    setFormHours(svc.estimated_hours.toString());
    setFormDiscount(svc.discount_percent?.toString() || '');
    setShowModal(true);
  };

  const handleDelete = (svc: ServiceItem) => {
    Alert.alert(
      'Hapus Layanan',
      `Yakin ingin menghapus "${svc.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/services/${svc.id}`);
              Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Layanan dihapus' });
              fetchData();
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Nama layanan wajib diisi' });
      return;
    }
    if (!formPrice || parseFloat(formPrice) <= 0) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: 'Harga harus diisi' });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        category_id: formCategory || undefined,
        name: formName,
        price_type: formPriceType,
        unit: formUnit,
        base_price: parseFloat(formPrice),
        discount_percent: parseFloat(formDiscount) || 0,
        estimated_hours: parseInt(formHours) || 24,
      };

      if (editing) {
        await api.put(`/services/${editing.id}`, payload);
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Layanan diperbarui' });
      } else {
        await api.post('/services', payload);
        Toast.show({ type: 'success', text1: 'Berhasil', text2: 'Layanan ditambahkan' });
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Gagal', text2: error.response?.data?.message || error.message });
    } finally {
      setSaving(false);
    }
  };

  const filtered = selectedCat === 'all'
    ? services
    : services.filter((s) => s.category_id === selectedCat);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || 'Unknown';

  const styles = React.useMemo(() => StyleSheet.create({
    content: { paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
    catFilter: { maxHeight: 44, marginBottom: spacing.sm },
    catChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray100 },
    catChipActive: { backgroundColor: colors.primary },
    serviceCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
    serviceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
    serviceInfo: { flex: 1 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    catOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray100 },
    catOptionActive: { backgroundColor: colors.primary },
    priceTypeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    priceTypeBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray100, alignItems: 'center' },
    priceTypeActive: { backgroundColor: colors.primary },
  }), [colors]);

  if (loading) return <LoadingScreen />;

  return (
    <ThemedView>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <ThemedText variant="title">Layanan</ThemedText>
              <ThemedText variant="caption">{services.length} total</ThemedText>
            </View>
            <FlatList
              horizontal
              data={[{ id: 'all', name: 'Semua' } as Category, ...categories]}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={styles.catFilter}
              contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catChip, selectedCat === item.id && styles.catChipActive]}
                  onPress={() => setSelectedCat(item.id)}
                >
                  <ThemedText
                    variant="caption"
                    color={selectedCat === item.id ? colors.white : colors.textSecondary}
                  >
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="pricetags-outline" title="Belum ada layanan" description="Tambahkan layanan laundry" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEdit(item)} onLongPress={() => handleDelete(item)}>
            <Card style={styles.serviceCard}>
              <View style={styles.serviceTop}>
                <View style={styles.serviceInfo}>
                  <ThemedText variant="body" weight="semibold">{item.name}</ThemedText>
                  <ThemedText variant="caption" color={colors.textSecondary}>
                    {getCategoryName(item.category_id)} • {item.price_type === 'weight' ? 'Per Kg' : 'Per Item'}
                  </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <ThemedText variant="body" weight="semibold" color={colors.primary}>
                    Rp {item.base_price.toLocaleString()}/{item.unit}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              {item.estimated_hours > 0 && (
                <ThemedText variant="caption" color={colors.textSecondary}>
                  Estimasi: {item.estimated_hours} jam
                </ThemedText>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="heading">{editing ? 'Edit Layanan' : 'Tambah Layanan'}</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
              <Input label="Nama Layanan" placeholder="Cuci Kering, Setrika..." value={formName} onChangeText={setFormName} icon="pricetag-outline" />

              <ThemedText variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Kategori</ThemedText>
              <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}
                nestedScrollEnabled
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.catOption, formCategory === item.id && styles.catOptionActive]}
                    onPress={() => setFormCategory(item.id)}
                  >
                    <ThemedText variant="caption" color={formCategory === item.id ? colors.white : colors.textSecondary}>
                      {item.name}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              />

              <ThemedText variant="body" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>Tipe Harga</ThemedText>
              <View style={styles.priceTypeRow}>
                <TouchableOpacity
                  style={[styles.priceTypeBtn, formPriceType === 'weight' && styles.priceTypeActive]}
                  onPress={() => { setFormPriceType('weight'); setFormUnit('kg'); }}
                >
                  <ThemedText color={formPriceType === 'weight' ? colors.white : colors.text}>Per Kg</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceTypeBtn, formPriceType === 'piece' && styles.priceTypeActive]}
                  onPress={() => { setFormPriceType('piece'); setFormUnit('pcs'); }}
                >
                  <ThemedText color={formPriceType === 'piece' ? colors.white : colors.text}>Per Item</ThemedText>
                </TouchableOpacity>
              </View>

              <Input label="Satuan" placeholder="kg" value={formUnit} onChangeText={setFormUnit} />
              <Input label="Harga" placeholder="10000" value={formPrice} onChangeText={setFormPrice} keyboardType="numeric" />
              <Input label="Diskon (%)" placeholder="0" value={formDiscount} onChangeText={setFormDiscount} keyboardType="numeric" icon="trending-down-outline" />
              <Input label="Estimasi (Jam)" placeholder="24" value={formHours} onChangeText={setFormHours} keyboardType="numeric" />

              <Button title={editing ? 'Simpan' : 'Tambah'} onPress={handleSave} loading={saving} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}


