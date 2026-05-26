import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'laundry_pos_theme';

export const lightColors = {
  primary: '#8B6914',
  primaryDark: '#6B4F0A',
  primaryLight: '#F5EDD6',
  secondary: '#8B7355',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
};

export const darkColors = {
  primary: '#A0782C',
  primaryDark: '#C4953E',
  primaryLight: '#3D2E1A',
  secondary: '#8B7355',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
  white: '#1E1E1E',
  black: '#FFFFFF',
  gray50: '#1F1F1F',
  gray100: '#2D2D2D',
  gray200: '#3D3D3D',
  gray300: '#555555',
  gray400: '#888888',
  gray500: '#AAAAAA',
  gray600: '#CCCCCC',
  gray700: '#DDDDDD',
  gray800: '#EEEEEE',
  gray900: '#F9F9F9',
  background: '#121212',
  surface: '#1E1E1E',
  border: '#374151',
  text: '#E5E7EB',
  textSecondary: '#9CA3AF',
};

interface ThemeState {
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  colors: lightColors,

  toggleTheme: () => {
    const next = !get().isDark;
    SecureStore.setItemAsync(STORAGE_KEY, next ? 'dark' : 'light');
    set({ isDark: next, colors: next ? darkColors : lightColors });
  },

  setTheme: (dark) => {
    SecureStore.setItemAsync(STORAGE_KEY, dark ? 'dark' : 'light');
    set({ isDark: dark, colors: dark ? darkColors : lightColors });
  },

  loadTheme: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored === 'dark') {
        set({ isDark: true, colors: darkColors });
      }
    } catch {}
  },
}));

export function useColors() {
  return useThemeStore((s) => s.colors);
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
