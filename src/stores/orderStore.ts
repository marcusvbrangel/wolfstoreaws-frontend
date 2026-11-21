import { defineStore } from 'pinia';
import type { Order } from '@/types/Order';

const ORDERS_KEY = 'wolf-store:orders:v1';

function loadOrders(): Order[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as Order[] : [];
  } catch {
    return [];
  }
}

export const useOrderStore = defineStore('orders', {
  state: () => ({ orders: loadOrders() }),
  actions: {
    createOrder(data: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
      const order: Order = {
        ...data,
        id: `WS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        status: 'SIMULATED',
      };
      this.orders.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(this.orders));
      return order;
    },
    findOrder(id: string): Order | undefined {
      return this.orders.find((order) => order.id === id);
    },
  },
});
