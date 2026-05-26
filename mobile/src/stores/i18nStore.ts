import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Language } from '@/lib/i18n';

const STORAGE_KEY = 'laundry_pos_language';

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  loadLanguage: () => Promise<void>;
}

export const useI18nStore = create<I18nState>((set) => ({
  language: 'id',

  setLanguage: async (lang: Language) => {
    await SecureStore.setItemAsync(STORAGE_KEY, lang);
    set({ language: lang });
  },

  loadLanguage: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored === 'en' || stored === 'id') {
        set({ language: stored });
      }
    } catch {}
  },
}));
