import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('laundry-pos.db');
    await initDatabase();
  }
  return db;
}

async function initDatabase() {
  const d = db!;
  await d.execAsync(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      branch_id TEXT,
      outlet_id TEXT,
      customer_id TEXT,
      user_id TEXT,
      invoice_number TEXT,
      status TEXT DEFAULT 'pending',
      order_type TEXT,
      service_type TEXT,
      total_weight REAL DEFAULT 0,
      total_items INTEGER DEFAULT 0,
      subtotal REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      payment_method TEXT,
      notes TEXT,
      estimated_done_at TEXT,
      completed_at TEXT,
      items_json TEXT,
      sync_status TEXT DEFAULT 'pending',
      updated_at TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      company_id TEXT,
      category_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      price_type TEXT DEFAULT 'weight',
      unit TEXT DEFAULT 'kg',
      base_price REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      min_quantity INTEGER DEFAULT 1,
      estimated_hours INTEGER DEFAULT 24,
      is_active INTEGER DEFAULT 1,
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      company_id TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      is_member INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS services_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sync_status TEXT DEFAULT 'synced',
      updated_at TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      action TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data_json TEXT,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS pending_mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      mutation_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      error TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      updated_at TEXT,
      created_at TEXT
    );
  `);

  migrateSchema(d);
}

async function migrateSchema(d: SQLite.SQLiteDatabase) {
  try {
    await d.runAsync("ALTER TABLE services ADD COLUMN discount_percent REAL DEFAULT 0");
  } catch {}
}

export const dbOrders = {
  upsert: async (order: any, syncStatus = 'synced') => {
    const d = await getDatabase();
    const itemsJson = JSON.stringify(order.items || []);
    await d.runAsync(
      `INSERT OR REPLACE INTO orders (id, tenant_id, company_id, branch_id, outlet_id, customer_id, user_id, invoice_number, status, order_type, service_type, total_weight, total_items, subtotal, discount_amount, tax_amount, grand_total, paid_amount, change_amount, payment_status, payment_method, notes, estimated_done_at, completed_at, items_json, sync_status, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      order.id, order.tenant_id, order.company_id, order.branch_id, order.outlet_id,
      order.customer_id, order.user_id, order.invoice_number, order.status,
      order.order_type, order.service_type, order.total_weight || 0, order.total_items || 0,
      order.subtotal || 0, order.discount_amount || 0, order.tax_amount || 0,
      order.grand_total || 0, order.paid_amount || 0, order.change_amount || 0,
      order.payment_status || 'unpaid', order.payment_method || '',
      order.notes || '', order.estimated_done_at, order.completed_at,
      itemsJson, syncStatus,
      order.updated_at || new Date().toISOString(),
      order.created_at || new Date().toISOString()
    );
  },
  getAll: async (): Promise<any[]> => {
    const d = await getDatabase();
    const rows = await d.getAllAsync<any>('SELECT * FROM orders ORDER BY created_at DESC');
    return rows.map((o: any) => ({ ...o, items: o.items_json ? JSON.parse(o.items_json) : [] }));
  },
  getRecent: async (months = 3): Promise<any[]> => {
    const d = await getDatabase();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const rows = await d.getAllAsync<any>(
      'SELECT * FROM orders WHERE created_at >= ? ORDER BY created_at DESC',
      cutoff.toISOString()
    );
    return rows.map((o: any) => ({ ...o, items: o.items_json ? JSON.parse(o.items_json) : [] }));
  },
  getById: async (id: string): Promise<any | null> => {
    const d = await getDatabase();
    const row = await d.getFirstAsync<any>('SELECT * FROM orders WHERE id = ?', id);
    if (!row) return null;
    return { ...row, items: row.items_json ? JSON.parse(row.items_json) : [] };
  },
  getByStatus: async (status: string): Promise<any[]> => {
    const d = await getDatabase();
    return d.getAllAsync<any>('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', status);
  },
  updateStatus: async (id: string, status: string, syncStatus = 'synced') => {
    const d = await getDatabase();
    await d.runAsync(
      "UPDATE orders SET status = ?, sync_status = ?, updated_at = ? WHERE id = ?",
      status, syncStatus, new Date().toISOString(), id
    );
  },
  delete: async (id: string) => {
    const d = await getDatabase();
    await d.runAsync('DELETE FROM orders WHERE id = ?', id);
  },
};

export const dbServices = {
  upsert: async (svc: any, syncStatus = 'synced') => {
    const d = await getDatabase();
    await d.runAsync(
      `INSERT OR REPLACE INTO services (id, tenant_id, company_id, category_id, name, description, price_type, unit, base_price, min_quantity, estimated_hours, discount_percent, is_active, sync_status, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      svc.id, svc.tenant_id, svc.company_id, svc.category_id, svc.name,
      svc.description || '', svc.price_type || 'weight', svc.unit || 'kg',
      svc.base_price || 0, svc.min_quantity || 1, svc.estimated_hours || 24,
      svc.discount_percent || 0, svc.is_active !== false ? 1 : 0,
      syncStatus,
      svc.updated_at || new Date().toISOString(),
      svc.created_at || new Date().toISOString()
    );
  },
  getAll: async (): Promise<any[]> => {
    const d = await getDatabase();
    return d.getAllAsync<any>('SELECT * FROM services WHERE is_active = 1 ORDER BY name ASC');
  },
  getById: async (id: string): Promise<any | null> => {
    const d = await getDatabase();
    return d.getFirstAsync<any>('SELECT * FROM services WHERE id = ?', id);
  },
  deactivate: async (id: string) => {
    const d = await getDatabase();
    await d.runAsync("UPDATE services SET is_active = 0, sync_status = 'pending' WHERE id = ?", id);
  },
  clear: async () => {
    const d = await getDatabase();
    await d.runAsync('DELETE FROM services');
  },
};

export const dbCategories = {
  upsert: async (cat: any) => {
    const d = await getDatabase();
    await d.runAsync(
      `INSERT OR REPLACE INTO services_categories (id, name, description, sort_order, is_active, sync_status, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'synced', ?, ?)`,
      cat.id, cat.name, cat.description || '', cat.sort_order || 0,
      cat.is_active !== false ? 1 : 0,
      cat.updated_at || new Date().toISOString(),
      cat.created_at || new Date().toISOString()
    );
  },
  getAll: async (): Promise<any[]> => {
    const d = await getDatabase();
    return d.getAllAsync<any>('SELECT * FROM services_categories WHERE is_active = 1 ORDER BY sort_order ASC');
  },
  clear: async () => {
    const d = await getDatabase();
    await d.runAsync('DELETE FROM services_categories');
  },
};

export const dbCustomers = {
  upsert: async (customer: any) => {
    const d = await getDatabase();
    await d.runAsync(
      `INSERT OR REPLACE INTO customers (id, tenant_id, company_id, name, phone, email, address, is_member, total_orders, total_spent, sync_status, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
      customer.id, customer.tenant_id, customer.company_id, customer.name,
      customer.phone || '', customer.email || '', customer.address || '',
      customer.is_member ? 1 : 0, customer.total_orders || 0, customer.total_spent || 0,
      customer.updated_at || new Date().toISOString(),
      customer.created_at || new Date().toISOString()
    );
  },
  getAll: async (): Promise<any[]> => {
    const d = await getDatabase();
    return d.getAllAsync<any>('SELECT * FROM customers ORDER BY name ASC');
  },
  getByPhone: async (phone: string): Promise<any | null> => {
    const d = await getDatabase();
    return d.getFirstAsync<any>('SELECT * FROM customers WHERE phone = ? LIMIT 1', phone);
  },
};

export const dbUsers = {
  upsert: async (user: any) => {
    const d = await getDatabase();
    await d.runAsync(
      `INSERT OR REPLACE INTO users (id, email, full_name, phone, role, is_active, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      user.id, user.email, user.full_name, user.phone || '',
      user.role, user.is_active !== false ? 1 : 0,
      user.updated_at || new Date().toISOString(),
      user.created_at || new Date().toISOString()
    );
  },
  getCurrent: async (): Promise<any | null> => {
    const d = await getDatabase();
    return d.getFirstAsync<any>('SELECT * FROM users ORDER BY created_at DESC LIMIT 1');
  },
  getByEmail: async (email: string): Promise<any | null> => {
    const d = await getDatabase();
    return d.getFirstAsync<any>('SELECT * FROM users WHERE email = ? LIMIT 1', email);
  },
  removeAll: async () => {
    const d = await getDatabase();
    await d.runAsync('DELETE FROM users');
  },
};

export const dbSyncQueue = {
  add: async (tableName: string, action: string, recordId: string, data: any) => {
    const d = await getDatabase();
    await d.runAsync(
      'INSERT INTO sync_queue (table_name, action, record_id, data_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      tableName, action, recordId, JSON.stringify(data), 'pending', new Date().toISOString()
    );
  },
  getPending: async (): Promise<any[]> => {
    const d = await getDatabase();
    return d.getAllAsync<any>('SELECT * FROM sync_queue WHERE status = ? ORDER BY id ASC', 'pending');
  },
  markSynced: async (id: number) => {
    const d = await getDatabase();
    await d.runAsync('UPDATE sync_queue SET status = ? WHERE id = ?', 'synced', id);
  },
  markFailed: async (id: number, error: string) => {
    const d = await getDatabase();
    await d.runAsync('UPDATE sync_queue SET status = ?, error_message = ?, retry_count = retry_count + 1 WHERE id = ?', 'failed', error, id);
  },
};
