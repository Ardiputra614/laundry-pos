import { create } from 'zustand';
import { api } from '@/lib/api';

interface SubscriptionState {
  status: string | null;
  loading: boolean;
  fetchSubscription: () => Promise<void>;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: null,
  loading: true,

  fetchSubscription: async () => {
    try {
      const { data } = await api.get('/subscription');
      set({ status: data.data?.status || null, loading: false });
    } catch {
      set({ status: null, loading: false });
    }
  },

  reset: () => set({ status: null, loading: true }),
}));
