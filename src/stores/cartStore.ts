import { defineStore } from 'pinia';
import { useProductStore } from '@/stores/productStore';
import type { CartEntry, CartLine, Product } from '@/types/Product';

const CART_KEY = 'wolf-store:cart:v1';

export interface CartReconciliationResult {
  changed: boolean;
  removed: number;
  adjusted: number;
}

function loadCartEntries(): CartEntry[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item: unknown): item is CartEntry => {
      if (typeof item !== 'object' || item === null) return false;
      const entry = item as Record<string, unknown>;
      return typeof entry.productId === 'string' && entry.productId.trim() !== '' &&
        typeof entry.quantity === 'number' && Number.isInteger(entry.quantity) && entry.quantity > 0;
    });
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({ items: loadCartEntries() }),
  getters: {
    detailedItems(state): CartLine[] {
      const productStore = useProductStore();
      return state.items.flatMap((entry) => {
        const product = productStore.products.find((candidate) => candidate.id === entry.productId);
        return product && product.stock > 0
          ? [{ ...product, quantity: Math.min(entry.quantity, product.stock) }]
          : [];
      });
    },
    itemCount(): number {
      return this.detailedItems.reduce((total, item) => total + item.quantity, 0);
    },
    subtotal(): number {
      return this.detailedItems.reduce((total, item) => total + item.price * item.quantity, 0);
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
    reconcileWithCatalog(): CartReconciliationResult {
      const productStore = useProductStore();
      if (productStore.status !== 'success') {
        return { changed: false, removed: 0, adjusted: 0 };
      }

      const quantities = new Map<string, number>();
      let removed = 0;
      let adjusted = 0;
      for (const entry of this.items) {
        const product = productStore.products.find((candidate) => candidate.id === entry.productId);
        if (!product || product.stock < 1) {
          removed += 1;
          continue;
        }
        if (entry.quantity > product.stock || quantities.has(entry.productId)) adjusted += 1;
        const accumulated = (quantities.get(entry.productId) || 0) + entry.quantity;
        quantities.set(entry.productId, Math.min(accumulated, product.stock));
      }

      const reconciledItems = Array.from(quantities, ([productId, quantity]) => ({ productId, quantity }));
      const changed = JSON.stringify(reconciledItems) !== JSON.stringify(this.items);
      if (changed) {
        this.items = reconciledItems;
        this.persist();
      }
      return { changed, removed, adjusted };
    },
    addItem(product: Product): boolean {
      const productStore = useProductStore();
      const catalogProduct = productStore.products.find((candidate) => candidate.id === product.id);
      if (!catalogProduct) return false;

      const selected = this.items.find((item) => item.productId === catalogProduct.id);
      if (selected) {
        if (selected.quantity >= catalogProduct.stock) return false;
        selected.quantity += 1;
      } else {
        if (catalogProduct.stock < 1) return false;
        this.items.push({ productId: catalogProduct.id, quantity: 1 });
      }
      this.persist();
      return true;
    },
    setQuantity(productId: string, quantity: number) {
      const productStore = useProductStore();
      const product = productStore.products.find((candidate) => candidate.id === productId);
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
