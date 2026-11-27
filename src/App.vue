<script setup lang="ts">
import { onMounted } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import { useCartStore } from '@/stores/cartStore';
import { useProductStore } from '@/stores/productStore';

const cartStore = useCartStore();
const productStore = useProductStore();

async function initializeCatalog() {
  await productStore.loadCatalog();
  if (productStore.status === 'success') {
    cartStore.reconcileWithCatalog();
  }
}

onMounted(() => {
  void initializeCatalog();
});
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="main-content">
      <section v-if="productStore.status === 'idle' || productStore.status === 'loading'" class="container inner-page catalog-load-state" aria-live="polite" aria-busy="true">
        <div class="catalog-spinner" aria-hidden="true"></div>
        <h1>Carregando catálogo</h1>
        <p>Buscando os produtos no serviço de catálogo...</p>
      </section>
      <section v-else-if="productStore.status === 'error'" class="container inner-page catalog-load-state" role="alert">
        <div class="empty-icon" aria-hidden="true">!</div>
        <h1>Não foi possível carregar o catálogo</h1>
        <p>{{ productStore.error }}</p>
        <button class="button button-primary" type="button" @click="initializeCatalog">Tentar novamente</button>
      </section>
      <RouterView v-else />
    </main>
    <AppFooter />
  </div>
</template>
