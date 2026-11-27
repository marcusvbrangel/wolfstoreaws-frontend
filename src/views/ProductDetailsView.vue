<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/utils/format';

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();
const productId = computed(() => String(route.params.id || ''));
const product = computed(() => productStore.products.find((candidate) => candidate.id === productId.value));
const productStatus = computed(() => productStore.productStatusById[productId.value] || 'idle');
const productError = computed(() => productStore.productErrorsById[productId.value]);
const message = ref('');
const adding = ref(false);

async function refreshProduct() {
  message.value = '';
  await productStore.loadProductById(productId.value);
}

async function add() {
  if (!product.value || adding.value) return;
  adding.value = true;
  message.value = '';

  try {
    const updatedProduct = await productStore.loadProductById(productId.value);
    if (!updatedProduct) {
      message.value = productError.value || 'Não foi possível atualizar este produto.';
      return;
    }
    message.value = cartStore.addItem(updatedProduct)
      ? 'Produto adicionado ao carrinho!'
      : 'Quantidade máxima disponível atingida.';
  } finally {
    adding.value = false;
  }
}

watch(productId, () => {
  void refreshProduct();
}, { immediate: true });
</script>

<template>
  <div class="container inner-page">
    <div v-if="productStatus === 'loading' && !product" class="empty-state" aria-live="polite">
      <div class="catalog-spinner" aria-hidden="true"></div><h1>Atualizando produto</h1><p>Consultando o catálogo...</p>
    </div>
    <div v-else-if="product">
      <nav class="breadcrumbs" aria-label="Você está aqui"><RouterLink to="/">Catálogo</RouterLink><span>/</span><span>{{ product.category }}</span><span>/</span><strong>{{ product.name }}</strong></nav>
      <div class="details-card">
        <div class="details-image"><img :src="product.imageUrl" :alt="product.name" /></div>
        <div class="details-info"><span class="eyebrow">{{ product.category }} · {{ product.id }}</span><h1>{{ product.name }}</h1><p class="details-description">{{ product.description }}</p>
          <div class="details-stock"><span class="inventory-dot"></span> {{ product.stock }} unidades disponíveis (simulado)</div>
          <div class="details-divider"></div><span class="small-muted">Preço demonstrativo à vista</span><div class="details-price">{{ formatCurrency(product.price) }}</div>
          <button class="button button-primary details-add" type="button" :disabled="product.stock === 0 || adding || productStatus === 'loading'" @click="add">{{ adding ? 'Atualizando...' : 'Adicionar ao carrinho' }} <span aria-hidden="true">+</span></button>
          <p v-if="productStatus === 'error'" class="inline-error" role="alert">{{ productError }} <button type="button" class="clear-button" @click="refreshProduct">Tentar novamente</button></p>
          <p v-if="message" class="inline-feedback" role="status">{{ message }} <RouterLink to="/carrinho">Ver carrinho →</RouterLink></p>
          <p class="details-footnote">Produto fictício para fins de estudo. Nenhuma venda real é realizada.</p>
        </div>
      </div>
    </div>
    <div v-else-if="productStatus === 'error'" class="empty-state"><h1>Não foi possível carregar o produto</h1><p>{{ productError }}</p><button class="button button-primary" type="button" @click="refreshProduct">Tentar novamente</button></div>
    <div v-else class="empty-state"><h1>Produto não encontrado</h1><RouterLink class="button button-primary" to="/">Voltar ao catálogo</RouterLink></div>
  </div>
</template>
