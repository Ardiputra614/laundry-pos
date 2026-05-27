import { create } from 'zustand';
import { api } from '@/lib/api';

interface SubscriptionState {
  status: string | null;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  loading: boolean;
  fetchSubscription: () => Promise<void>;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: null,
  expiresAt: null,
  daysUntilExpiry: null,
  loading: true,

  fetchSubscription: async () => {
    try {
      const { data } = await api.get('/subscription');
      const subData = data.data || {};
      const expiresAt = subData.current_period_end || null;
      let daysUntilExpiry: number | null = null;
      if (expiresAt) {
        const now = new Date();
        const expDate = new Date(expiresAt);
        const diffMs = expDate.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      set({
        status: subData.status || 'none',
        expiresAt,
        daysUntilExpiry,
        loading: false,
      });
    } catch {
      set({ status: 'none', expiresAt: null, daysUntilExpiry: null, loading: false });
    }
  },

  reset: () => set({ status: null, expiresAt: null, daysUntilExpiry: null, loading: true }),
}));
