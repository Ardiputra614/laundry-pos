import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  tenantId: string | null;
  companyId: string | null;
  setUser: (user: User | null) => void;
  setTenantId: (id: string) => void;
  setCompanyId: (id: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenantId: null,
  companyId: null,
  setUser: (user) => set({ user }),
  setTenantId: (tenantId) => set({ tenantId }),
  setCompanyId: (companyId) => set({ companyId }),
  reset: () => set({ user: null, tenantId: null, companyId: null }),
}));
