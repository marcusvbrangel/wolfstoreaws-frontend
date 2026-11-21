import { defineStore } from 'pinia';
import { products } from '@/data/products';
import type { Category, Product } from '@/types/Product';

export type ProductSort = 'name' | 'price-asc' | 'price-desc';
export type CategoryFilter = Category | 'Todas';

function simplify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export const useProductStore = defineStore('products', {
  state: () => ({
    products,
    search: '',
    category: 'Todas' as CategoryFilter,
    sortBy: 'name' as ProductSort,
  }),
  getters: {
    filteredProducts(state): Product[] {
      const term = simplify(state.search.trim());
      const filtered = state.products.filter((product) => {
        const matchesCategory = state.category === 'Todas' || product.category === state.category;
        const matchesSearch = !term || simplify(`${product.name} ${product.description} ${product.category}`).includes(term);
        return matchesCategory && matchesSearch;
      });

      return filtered.sort((a, b) => {
        if (state.sortBy === 'price-asc') return a.price - b.price;
        if (state.sortBy === 'price-desc') return b.price - a.price;
        return a.name.localeCompare(b.name, 'pt-BR');
      });
    },
  },
});
