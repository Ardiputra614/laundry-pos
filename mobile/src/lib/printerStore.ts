import * as SecureStore from 'expo-secure-store';

const PRINTER_KEY = 'saved_printer';

export interface SavedPrinter {
  id: string;
  name: string;
}

export async function savePrinter(p: SavedPrinter) {
  await SecureStore.setItemAsync(PRINTER_KEY, JSON.stringify(p));
}

export async function getSavedPrinter(): Promise<SavedPrinter | null> {
  const raw = await SecureStore.getItemAsync(PRINTER_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function removeSavedPrinter() {
  await SecureStore.deleteItemAsync(PRINTER_KEY);
}
