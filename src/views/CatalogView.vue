<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import ProductCard from '@/components/ProductCard.vue';
import { useProductStore, type CategoryFilter } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types/Product';

const store = useProductStore();
const cart = useCartStore();
const visibleCount = ref(12);
const notification = ref('');
const validatingProductIds = reactive(new Set<string>());
let notificationTimer: ReturnType<typeof setTimeout> | undefined;

const categories: { name: CategoryFilter; icon: string }[] = [
  { name: 'Todas', icon: '✦' },
  { name: 'Notebooks', icon: '💻' },
  { name: 'Monitores', icon: '🖥️' },
  { name: 'Periféricos', icon: '⌨️' },
  { name: 'Smartphones', icon: '📱' },
];

const shownProducts = computed(() => store.filteredProducts.slice(0, visibleCount.value));
const moreToShow = computed(() => visibleCount.value < store.filteredProducts.length);
const countInCategory = (category: CategoryFilter): number =>
  category === 'Todas' ? store.products.length : store.products.filter((p) => p.category === category).length;

watch(() => [store.search, store.category, store.sortBy], () => {
  visibleCount.value = 12;
});

function notify(message: string) {
  notification.value = message;
  if (notificationTimer) clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => { notification.value = ''; }, 2400);
}

async function addToCart(product: Product) {
  if (validatingProductIds.has(product.id)) return;
  validatingProductIds.add(product.id);

  try {
    const updatedProduct = await store.loadProductById(product.id);
    if (!updatedProduct) {
      notify(store.productErrorsById[product.id] || 'Não foi possível atualizar este produto.');
      return;
    }

    const added = cart.addItem(updatedProduct);
    notify(added ? `${updatedProduct.name} adicionado ao carrinho` : 'Você atingiu o estoque disponível deste produto.');
  } finally {
    validatingProductIds.delete(product.id);
  }
}

function clearFilters() {
  store.search = '';
  store.category = 'Todas';
  store.sortBy = 'name';
}

onBeforeUnmount(() => {
  if (notificationTimer) clearTimeout(notificationTimer);
});
</script>

<template>
  <div class="container catalog-page">
    <section class="hero" aria-labelledby="hero-heading">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="pulse-dot"></span> CATÁLOGO WOLF STORE</div>
        <h1 id="hero-heading">Tecnologia com <em>atitude.</em></h1>
        <p>Seu espaço para explorar tecnologia. Design limpo, produtos organizados e compras sem complicação.</p>
        <a class="button hero-button" href="#catalogo">Explorar produtos <span aria-hidden="true">↗</span></a>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><img src="/assets/wolf-mark.svg" alt="" /></div>
    </section>

    <section id="catalogo" class="catalog-section" aria-labelledby="catalog-heading">
      <div class="section-heading">
        <div><span class="section-eyebrow">ENCONTRE O QUE PROCURA</span><h2 id="catalog-heading">Nossos produtos<span class="heading-dot">.</span></h2></div>
        <span class="inventory-count"><span class="inventory-dot"></span> {{ store.products.length }} produtos disponíveis</span>
      </div>

      <div class="category-list" aria-label="Filtrar por categoria">
        <button v-for="category in categories" :key="category.name" type="button" class="category-pill" :class="{ selected: store.category === category.name }" :aria-pressed="store.category === category.name" @click="store.category = category.name">
          <span class="category-emoji" aria-hidden="true">{{ category.icon }}</span>
          <span>{{ category.name }}</span>
          <span class="category-count">{{ countInCategory(category.name) }}</span>
        </button>
      </div>

      <div class="catalog-toolbar">
        <div class="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.4 16.4 4.1 4.1"/></svg>
          <input v-model="store.search" type="search" placeholder="Pesquisar por nome ou característica..." aria-label="Pesquisar produtos" />
        </div>
        <label class="sort-field"><span>Ordenar:</span><select v-model="store.sortBy" aria-label="Ordenar produtos"><option value="name">Nome (A–Z)</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label>
      </div>

      <div class="results-row"><span>{{ store.filteredProducts.length }} {{ store.filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados' }}</span><button v-if="store.category !== 'Todas' || store.search || store.sortBy !== 'name'" type="button" class="clear-button" @click="clearFilters">Limpar filtros ×</button></div>

      <div v-if="shownProducts.length > 0" class="products-grid">
        <ProductCard v-for="product in shownProducts" :key="product.id" :product="product" :loading="validatingProductIds.has(product.id)" @add="addToCart" />
      </div>
      <div v-else class="empty-state"><div class="empty-icon">⌕</div><h3>Nenhum produto encontrado</h3><p>Tente outro termo de pesquisa ou remova os filtros.</p><button class="button button-secondary" type="button" @click="clearFilters">Limpar filtros</button></div>

      <div v-if="moreToShow" class="load-more"><p>Exibindo {{ shownProducts.length }} de {{ store.filteredProducts.length }} produtos</p><button type="button" class="button button-outline" @click="visibleCount += 12">Mostrar mais produtos <span aria-hidden="true">↓</span></button></div>
    </section>
    <div v-if="notification" class="toast" role="status" aria-live="polite"><span class="toast-check">✓</span>{{ notification }}</div>
  </div>
</template>
