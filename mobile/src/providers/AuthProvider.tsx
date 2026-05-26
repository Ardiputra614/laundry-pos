import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, TOKEN_KEY, REFRESH_KEY } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, User } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { startSyncEngine, stopSyncEngine } from '@/lib/sync';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, deviceId?: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setTenantId, setCompanyId } = useAuthStore();
  const { fetchSubscription, reset: resetSub } = useSubscriptionStore();

  const storeTenantInfo = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.data?.tenant_id) setTenantId(data.data.tenant_id);
      if (data.data?.company_id) setCompanyId(data.data.company_id);
    } catch {}
  };

  const restoreSession = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const { data } = await api.get('/profile');
        setUser(data.data);
        await storeTenantInfo();
        startSyncEngine();
        fetchSubscription();
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const login = async (email: string, password: string, deviceId?: string) => {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', {
      email, password, device_id: deviceId,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, data.data.access_token);
    await SecureStore.setItemAsync(REFRESH_KEY, data.data.refresh_token);
    setUser(data.data.user);
    await storeTenantInfo();
    startSyncEngine();
    fetchSubscription();
  };

  const register = async (registerData: { email: string; password: string; full_name: string; phone?: string }) => {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/register', registerData);
    await SecureStore.setItemAsync(TOKEN_KEY, data.data.access_token);
    await SecureStore.setItemAsync(REFRESH_KEY, data.data.refresh_token);
    setUser(data.data.user);
    await storeTenantInfo();
    startSyncEngine();
    fetchSubscription();
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    stopSyncEngine();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setUser(null);
    resetSub();
  };

  const refreshUser = async () => {
    const { data } = await api.get('/profile');
    setUser(data.data);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
