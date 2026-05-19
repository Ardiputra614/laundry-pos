import * as SQLite from 'expo-sqlite';

let db: SQLite.WebSQLDatabase;

export function getDatabase() {
  if (!db) {
    db = SQLite.openDatabase('laundry-pos.db');
    initDatabase();
  }
  return db;
}

function initDatabase() {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
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
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        customer_id TEXT,
        invoice_number TEXT,
        status TEXT DEFAULT 'pending',
        total_weight REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        grand_total REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'unpaid',
        notes TEXT,
        items_json TEXT,
        sync_status TEXT DEFAULT 'pending',
        updated_at TEXT,
        created_at TEXT
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price_type TEXT DEFAULT 'weight',
        unit TEXT DEFAULT 'kg',
        base_price REAL DEFAULT 0,
        estimated_hours INTEGER DEFAULT 24,
        sync_status TEXT DEFAULT 'synced',
        updated_at TEXT
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        action TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data_json TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS pending_mutations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        mutation_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error TEXT,
        created_at TEXT
      );`
    );
  });
}

export const dbCustomers = {
  upsert: (customer: any) => {
    getDatabase().transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO customers (id, tenant_id, company_id, name, phone, email, address, is_member, total_orders, total_spent, sync_status, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [customer.id, customer.tenant_id, customer.company_id, customer.name, customer.phone, customer.email, customer.address, customer.is_member ? 1 : 0, customer.total_orders || 0, customer.total_spent || 0, customer.updated_at || new Date().toISOString(), customer.created_at || new Date().toISOString()]
      );
    });
  },
  getAll: (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      getDatabase().transaction((tx) => {
        tx.executeSql('SELECT * FROM customers ORDER BY name', [], (_, { rows }) => {
          resolve(rows._array);
        }, (_, err) => { reject(err); return false; });
      });
    });
  },
  search: (query: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      getDatabase().transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name',
          [`%${query}%`, `%${query}%`],
          (_, { rows }) => resolve(rows._array),
          (_, err) => { reject(err); return false; }
        );
      });
    });
  },
};

export const dbOrders = {
  upsert: (order: any) => {
    getDatabase().transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO orders (id, tenant_id, company_id, customer_id, invoice_number, status, total_weight, subtotal, discount_amount, tax_amount, grand_total, payment_status, notes, items_json, sync_status, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        [order.id, order.tenant_id, order.company_id, order.customer_id, order.invoice_number, order.status, order.total_weight || 0, order.subtotal || 0, order.discount_amount || 0, order.tax_amount || 0, order.grand_total || 0, order.payment_status || 'unpaid', order.notes || '', JSON.stringify(order.items || []), order.updated_at || new Date().toISOString(), order.created_at || new Date().toISOString()]
      );
    });
  },
  getAll: (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      getDatabase().transaction((tx) => {
        tx.executeSql('SELECT * FROM orders ORDER BY created_at DESC', [], (_, { rows }) => {
          const orders = rows._array.map((o: any) => ({ ...o, items: o.items_json ? JSON.parse(o.items_json) : [] }));
          resolve(orders);
        }, (_, err) => { reject(err); return false; });
      });
    });
  },
  getByStatus: (status: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      getDatabase().transaction((tx) => {
        tx.executeSql('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', [status], (_, { rows }) => resolve(rows._array), (_, err) => { reject(err); return false; });
      });
    });
  },
};

export const dbSyncQueue = {
  add: (tableName: string, action: string, recordId: string, data: any) => {
    getDatabase().transaction((tx) => {
      tx.executeSql(
        'INSERT INTO sync_queue (table_name, action, record_id, data_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [tableName, action, recordId, JSON.stringify(data), 'pending', new Date().toISOString()]
      );
    });
  },
  getPending: (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      getDatabase().transaction((tx) => {
        tx.executeSql('SELECT * FROM sync_queue WHERE status = ? ORDER BY id ASC', ['pending'], (_, { rows }) => {
          resolve(rows._array);
        }, (_, err) => { reject(err); return false; });
      });
    });
  },
  markSynced: (id: number) => {
    getDatabase().transaction((tx) => {
      tx.executeSql('UPDATE sync_queue SET status = ? WHERE id = ?', ['synced', id]);
    });
  },
  markFailed: (id: number, error: string) => {
    getDatabase().transaction((tx) => {
      tx.executeSql('UPDATE sync_queue SET status = ?, error_message = ?, retry_count = retry_count + 1 WHERE id = ?', ['failed', error, id]);
    });
  },
};
