import * as Network from 'expo-network';
import { api } from './api';
import { dbSyncQueue, dbOrders, dbServices, dbCustomers, dbCategories } from './database';
import { useAuthStore } from '@/stores/authStore';

let isSyncing = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

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
          case 'services':
            await api.post('/services', data);
            break;
          case 'customers':
            break;
        }
        dbSyncQueue.markSynced(item.id);
        console.log(`[Sync] Synced ${item.table_name}:${item.id}`);
      } catch (error: any) {
        console.error(`[Sync] Failed to sync ${item.table_name}:${item.id}`, error.message);
        dbSyncQueue.markFailed(item.id, error.message);
      }
    }

    const { tenantId, companyId } = useAuthStore.getState();

    try {
      const { data: ordersData } = await api.get('/orders?limit=50');
      if (ordersData.data) {
        ordersData.data.forEach((o: any) =>
          dbOrders.upsert({ ...o, tenant_id: o.tenant_id || tenantId, company_id: o.company_id || companyId }, 'synced')
        );
      }
    } catch (e) {
      console.log('[Sync] Failed to pull orders');
    }

    try {
      const { data: servicesData } = await api.get('/services?limit=200');
      if (servicesData.data) {
        dbServices.clear();
        servicesData.data.forEach((s: any) =>
          dbServices.upsert({ ...s, tenant_id: s.tenant_id || tenantId, company_id: s.company_id || companyId })
        );
      }
    } catch (e) {
      console.log('[Sync] Failed to pull services');
    }

    try {
      const { data: catData } = await api.get('/services/categories');
      if (catData.data) {
        dbCategories.clear();
        catData.data.forEach(dbCategories.upsert);
      }
    } catch (e) {
      console.log('[Sync] Failed to pull categories');
    }

    console.log('[Sync] Synchronization complete');
  } catch (error) {
    console.error('[Sync] Sync error:', error);
  } finally {
    isSyncing = false;
  }
}
