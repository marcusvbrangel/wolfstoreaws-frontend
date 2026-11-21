import { defineStore } from 'pinia';
import { products } from '@/data/products';
import type { CartEntry, CartLine, Product } from '@/types/Product';

const CART_KEY = 'wolf-store:cart:v1';

function loadCart(): CartEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item: unknown): item is CartEntry => {
      if (typeof item !== 'object' || item === null) return false;
      const entry = item as Record<string, unknown>;
      const product = products.find((p) => p.id === entry.productId);
      return Boolean(product && typeof entry.quantity === 'number' && Number.isInteger(entry.quantity) &&
        entry.quantity > 0 && entry.quantity <= product.stock);
    });
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({ items: loadCart() as CartEntry[] }),
  getters: {
    detailedItems(state): CartLine[] {
      return state.items.flatMap((entry) => {
        const product = products.find((p) => p.id === entry.productId);
        return product ? [{ ...product, quantity: entry.quantity }] : [];
      });
    },
    itemCount(state): number {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    },
    subtotal(state): number {
      return state.items.reduce((total, item) => {
        const product = products.find((p) => p.id === item.productId);
        return total + (product ? product.price * item.quantity : 0);
      }, 0);
    },
    shipping(): number {
      return this.subtotal === 0 || this.subtotal >= 299 ? 0 : 24.9;
    },
    total(): number {
      return this.subtotal + this.shipping;
    },
  },
  actions: {
    persist() {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    },
    addItem(product: Product): boolean {
      const selected = this.items.find((item) => item.productId === product.id);
      if (selected) {
        if (selected.quantity >= product.stock) return false;
        selected.quantity += 1;
      } else {
        if (product.stock < 1) return false;
        this.items.push({ productId: product.id, quantity: 1 });
      }
      this.persist();
      return true;
    },
    setQuantity(productId: string, quantity: number) {
      const product = products.find((p) => p.id === productId);
      const normalized = Math.floor(quantity);
      if (!product || !Number.isFinite(normalized)) return;
      if (normalized <= 0) {
        this.removeItem(productId);
        return;
      }
      const line = this.items.find((item) => item.productId === productId);
      if (line) line.quantity = Math.min(normalized, product.stock);
      this.persist();
    },
    removeItem(productId: string) {
      this.items = this.items.filter((item) => item.productId !== productId);
      this.persist();
    },
    clearCart() {
      this.items = [];
      this.persist();
    },
  },
});
