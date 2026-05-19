import * as Network from 'expo-network';
import { api } from './api';
import { dbSyncQueue, dbOrders, dbCustomers } from './database';

let isSyncing = false;
let syncInterval: NodeJS.Timeout | null = null;

export async function startSyncEngine(intervalMs = 30000) {
  await syncNow();
  syncInterval = setInterval(syncNow, intervalMs);
}

export function stopSyncEngine() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function syncNow() {
  if (isSyncing) return;

  const networkState = await Network.getNetworkStateAsync();
  if (!networkState.isConnected || !networkState.isInternetReachable) {
    console.log('[Sync] No internet connection, skipping');
    return;
  }

  isSyncing = true;
  console.log('[Sync] Starting synchronization');

  try {
    const pending = await dbSyncQueue.getPending();
    for (const item of pending) {
      try {
        const data = JSON.parse(item.data_json);
        switch (item.table_name) {
          case 'orders':
            await api.post('/orders', data);
            break;
          case 'customers':
            await api.post('/customers', data);
            break;
        }
        dbSyncQueue.markSynced(item.id);
        console.log(`[Sync] Synced ${item.table_name}:${item.id}`);
      } catch (error: any) {
        console.error(`[Sync] Failed to sync ${item.table_name}:${item.id}`, error.message);
        dbSyncQueue.markFailed(item.id, error.message);
      }
    }

    try {
      const { data: ordersData } = await api.get('/orders?limit=50');
      if (ordersData.data) {
        ordersData.data.forEach(dbOrders.upsert);
      }
    } catch (e) {
      console.log('[Sync] Failed to pull orders');
    }

    try {
      const { data: customersData } = await api.get('/customers?limit=50');
      if (customersData.data) {
        customersData.data.forEach(dbCustomers.upsert);
      }
    } catch (e) {
      console.log('[Sync] Failed to pull customers');
    }

    console.log('[Sync] Synchronization complete');
  } catch (error) {
    console.error('[Sync] Sync error:', error);
  } finally {
    isSyncing = false;
  }
}
