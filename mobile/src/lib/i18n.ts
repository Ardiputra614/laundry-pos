export type Language = 'id' | 'en';

type TranslationMap = Record<string, Record<Language, string>>;

export const translations: TranslationMap = {
  // Order statuses
  'status.pending': { id: 'Menunggu', en: 'Pending' },
  'status.processing': { id: 'Diproses', en: 'Processing' },
  'status.washing': { id: 'Mencuci', en: 'Washing' },
  'status.drying': { id: 'Mengeringkan', en: 'Drying' },
  'status.ironing': { id: 'Menyetrika', en: 'Ironing' },
  'status.packing': { id: 'Mengemas', en: 'Packing' },
  'status.ready': { id: 'Siap', en: 'Ready' },
  'status.delivered': { id: 'Diantar', en: 'Delivered' },
  'status.finished': { id: 'Selesai', en: 'Finished' },
  'status.completed': { id: 'Selesai', en: 'Completed' },
  'status.cancelled': { id: 'Dibatalkan', en: 'Cancelled' },

  // Payment statuses
  'payment.unpaid': { id: 'Belum Dibayar', en: 'Unpaid' },
  'payment.partial': { id: 'Sebagian', en: 'Partial' },
  'status.paid': { id: 'Lunas', en: 'Paid' },
  'payment.refunded': { id: 'Dikembalikan', en: 'Refunded' },

  // Subscription statuses
  'subscription.active': { id: 'Aktif', en: 'Active' },
  'subscription.trial': { id: 'Masa Percobaan', en: 'Trial' },
  'subscription.inactive': { id: 'Tidak Aktif', en: 'Inactive' },
  'subscription.suspended': { id: 'Ditangguhkan', en: 'Suspended' },

  // Navigation
  'nav.home': { id: 'Beranda', en: 'Home' },
  'nav.orders': { id: 'Pesanan', en: 'Orders' },
  'nav.pos': { id: 'POS', en: 'POS' },
  'nav.scan': { id: 'Pindai', en: 'Scan' },
  'nav.services': { id: 'Layanan', en: 'Services' },
  'nav.report': { id: 'Laporan', en: 'Report' },
  'nav.more': { id: 'Lainnya', en: 'More' },

  // Orders page
  'orders.title': { id: 'Pesanan', en: 'Orders' },
  'orders.search.placeholder': { id: 'Cari invoice atau pelanggan...', en: 'Search by invoice or customer...' },
  'orders.filter.all': { id: 'Semua', en: 'All' },
  'orders.empty.title': { id: 'Belum ada pesanan', en: 'No orders found' },
  'orders.empty.desc': { id: 'Buat pesanan pertama Anda', en: 'Create your first order' },
  'orders.empty.search': { id: 'Coba kata kunci lain', en: 'Try a different search' },
  'orders.empty.action': { id: 'Pesanan Baru', en: 'New Order' },

  // Settings
  'settings.title': { id: 'Pengaturan', en: 'Settings' },
  'settings.tax_label': { id: 'Pajak (PPN)', en: 'Tax (VAT)' },
  'settings.tax_desc': { id: 'Aktifkan pajak otomatis di pesanan baru', en: 'Auto-apply tax on new orders' },
  'settings.tax_rate': { id: 'Persentase Pajak (%)', en: 'Tax Rate (%)' },
  'settings.discount_label': { id: 'Diskon Layanan', en: 'Service Discount' },
  'settings.discount_desc': { id: 'Aktifkan diskon per layanan (%)', en: 'Enable per-service discount (%)' },
  'settings.save': { id: 'Simpan Pengaturan', en: 'Save Settings' },
  'settings.language': { id: 'Bahasa', en: 'Language' },
  'settings.theme_label': { id: 'Tampilan', en: 'Appearance' },

  // Order detail
  'order.detail.title': { id: 'Detail Pesanan', en: 'Order Detail' },
  'order.status_timeline': { id: 'Status Timeline', en: 'Status Timeline' },
  'order.items': { id: 'Item', en: 'Items' },
  'order.payment': { id: 'Pembayaran', en: 'Payment' },
  'order.info': { id: 'Info Pesanan', en: 'Order Info' },
  'order.change_status_to': { id: 'Ubah Status', en: 'Change Status' },
  'order.mark_paid': { id: 'Tandai Dibayar', en: 'Mark as Paid' },
  'order.print_receipt': { id: 'Cetak Struk', en: 'Print Receipt' },
  'order.print_qr': { id: 'Cetak QR', en: 'Print QR' },
  'order.not_found': { id: 'Pesanan tidak ditemukan', en: 'Order not found' },
  'order.back': { id: 'Kembali', en: 'Back' },
  'order.type_dropoff': { id: 'Antar Sendiri', en: 'Drop Off' },
  'order.type_pickup': { id: 'Pickup', en: 'Pickup' },
  'order.service_regular': { id: 'Reguler', en: 'Regular' },
  'order.service_express': { id: 'Ekspres', en: 'Express' },
  'order.subtotal': { id: 'Subtotal', en: 'Subtotal' },
  'order.discount': { id: 'Diskon', en: 'Discount' },
  'order.tax': { id: 'Pajak', en: 'Tax' },
  'order.total': { id: 'Total', en: 'Total' },
  'order.paid': { id: 'Dibayar', en: 'Paid' },
  'order.status': { id: 'Status', en: 'Status' },

  // Services
  'services.title': { id: 'Layanan', en: 'Services' },
  'services.filter_all': { id: 'Semua', en: 'All' },
  'services.add': { id: 'Tambah Layanan', en: 'Add Service' },
  'services.edit': { id: 'Edit Layanan', en: 'Edit Service' },
  'services.delete_confirm': { id: 'Yakin ingin menghapus', en: 'Are you sure to delete' },
  'services.empty': { id: 'Belum ada layanan', en: 'No services yet' },
  'services.empty_desc': { id: 'Tambahkan layanan laundry', en: 'Add laundry services' },

  // POS
  'pos.new_order': { id: 'Pesanan Baru', en: 'New Order' },
  'pos.customer_data': { id: 'Data Pelanggan', en: 'Customer Data' },
  'pos.customer_name': { id: 'Nama Lengkap', en: 'Full Name' },
  'pos.customer_phone': { id: 'No. WhatsApp', en: 'Phone Number' },
  'pos.customer_address': { id: 'Alamat', en: 'Address' },
  'pos.services': { id: 'Layanan', en: 'Services' },
  'pos.add_service': { id: 'Tambahkan layanan dengan menekan tombol +', en: 'Add services by pressing the + button' },
  'pos.service_name': { id: 'Nama Layanan', en: 'Service Name' },
  'pos.qty': { id: 'Jumlah', en: 'Qty' },
  'pos.unit': { id: 'Satuan', en: 'Unit' },
  'pos.price': { id: 'Harga Satuan', en: 'Unit Price' },
  'pos.summary': { id: 'Ringkasan Biaya', en: 'Cost Summary' },
  'pos.discount': { id: 'Diskon Layanan', en: 'Service Discount' },
  'pos.order_type': { id: 'Tipe Pesanan', en: 'Order Type' },
  'pos.notes': { id: 'Catatan', en: 'Notes' },
  'pos.submit': { id: 'Buat Pesanan', en: 'Create Order' },
  'pos.pick_service': { id: 'Pilih Layanan', en: 'Pick Service' },
  'pos.no_services': { id: 'Belum ada layanan', en: 'No services available' },

  // Report
  'report.title': { id: 'Laporan', en: 'Report' },
  'report.keuntungan': { id: 'Keuntungan', en: 'Profit' },
  'report.total_revenue': { id: 'Total Pendapatan', en: 'Total Revenue' },
  'report.discount': { id: 'Diskon', en: 'Discount' },
  'report.tax': { id: 'Pajak', en: 'Tax' },
  'report.net_profit': { id: 'Keuntungan Bersih', en: 'Net Profit' },
  'report.net': { id: 'Bersih', en: 'Net' },
  'report.services_used': { id: 'Layanan Terpakai', en: 'Services Used' },
  'report.by_status': { id: 'Berdasarkan Status', en: 'By Status' },
  'report.total_orders': { id: 'Total Pesanan', en: 'Total Orders' },
  'report.avg_per_day': { id: 'Rata-rata/Hari', en: 'Avg/Day' },
  'report.orders': { id: 'Pesanan', en: 'Orders' },
  'report.revenue': { id: 'Pendapatan', en: 'Revenue' },

  // Profile/More
  'profile.logout': { id: 'Keluar', en: 'Logout' },
  'profile.subscription': { id: 'Langganan', en: 'Subscription' },
  'profile.account_info': { id: 'Info Akun', en: 'Account Info' },
  'profile.name': { id: 'Nama', en: 'Name' },
  'profile.email': { id: 'Email', en: 'Email' },
  'profile.phone': { id: 'Telepon', en: 'Phone' },
  'profile.role': { id: 'Peran', en: 'Role' },

  // General
  'general.save': { id: 'Simpan', en: 'Save' },
  'general.cancel': { id: 'Batal', en: 'Cancel' },
  'general.delete': { id: 'Hapus', en: 'Delete' },
  'general.search': { id: 'Cari', en: 'Search' },
  'general.loading': { id: 'Memuat...', en: 'Loading...' },
  'general.success': { id: 'Berhasil', en: 'Success' },
  'general.error': { id: 'Gagal', en: 'Failed' },

  // Common form
  'form.name': { id: 'Nama', en: 'Name' },
  'form.description': { id: 'Deskripsi', en: 'Description' },
  'form.price': { id: 'Harga', en: 'Price' },
  'form.discount': { id: 'Diskon (%)', en: 'Discount (%)' },
  'form.estimated_hours': { id: 'Estimasi (Jam)', en: 'Estimate (Hours)' },
  'form.unit': { id: 'Satuan', en: 'Unit' },
  'form.category': { id: 'Kategori', en: 'Category' },
  'form.price_type': { id: 'Tipe Harga', en: 'Price Type' },
  'form.per_kg': { id: 'Per Kg', en: 'Per Kg' },
  'form.per_item': { id: 'Per Item', en: 'Per Item' },
};

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] || key;
}

export function tStatus(status: string, lang: Language): string {
  const key = `status.${status.toLowerCase()}`;
  const translated = t(key, lang);
  if (translated !== key) return translated;

  const payKey = `payment.${status.toLowerCase()}`;
  const payTranslated = t(payKey, lang);
  if (payTranslated !== payKey) return payTranslated;

  return status.charAt(0).toUpperCase() + status.slice(1);
}
