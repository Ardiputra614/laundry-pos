import { create } from 'zustand';
import { Order, OrderItem } from '@/types';

interface OrderState {
  currentOrder: {
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    order_type: 'pickup' | 'dropoff';
    service_type: 'regular' | 'express';
    items: OrderItem[];
    notes: string;
  } | null;
  offlineOrders: Order[];
  setCurrentOrder: (order: any) => void;
  addItem: (item: OrderItem) => void;
  removeItem: (index: number) => void;
  clearCurrentOrder: () => void;
  addOfflineOrder: (order: Order) => void;
  removeOfflineOrder: (id: string) => void;
  clearOfflineOrders: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentOrder: null,
  offlineOrders: [],
  setCurrentOrder: (order) => set({ currentOrder: order }),
  addItem: (item) => set((state) => ({
    currentOrder: state.currentOrder ? {
      ...state.currentOrder,
      items: [...state.currentOrder.items, item],
    } : null,
  })),
  removeItem: (index) => set((state) => ({
    currentOrder: state.currentOrder ? {
      ...state.currentOrder,
      items: state.currentOrder.items.filter((_, i) => i !== index),
    } : null,
  })),
  clearCurrentOrder: () => set({ currentOrder: null }),
  addOfflineOrder: (order) => set((state) => ({
    offlineOrders: [...state.offlineOrders, order],
  })),
  removeOfflineOrder: (id) => set((state) => ({
    offlineOrders: state.offlineOrders.filter((o) => o.id !== id),
  })),
  clearOfflineOrders: () => set({ offlineOrders: [] }),
}));
