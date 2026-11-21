<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/utils/format';

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();
const product = computed(() => productStore.products.find((p) => p.id === route.params.id));
const message = ref('');

function add() {
  if (!product.value) return;
  message.value = cartStore.addItem(product.value)
    ? 'Produto adicionado ao carrinho!'
    : 'Quantidade máxima disponível atingida.';
}
</script>

<template>
  <div class="container inner-page">
    <div v-if="product">
      <nav class="breadcrumbs" aria-label="Você está aqui"><RouterLink to="/">Catálogo</RouterLink><span>/</span><span>{{ product.category }}</span><span>/</span><strong>{{ product.name }}</strong></nav>
      <div class="details-card">
        <div class="details-image"><img :src="product.imageUrl" :alt="product.name" /></div>
        <div class="details-info"><span class="eyebrow">{{ product.category }} · {{ product.id }}</span><h1>{{ product.name }}</h1><p class="details-description">{{ product.description }}</p>
          <div class="details-stock"><span class="inventory-dot"></span> {{ product.stock }} unidades disponíveis (simulado)</div>
          <div class="details-divider"></div><span class="small-muted">Preço demonstrativo à vista</span><div class="details-price">{{ formatCurrency(product.price) }}</div>
          <button class="button button-primary details-add" type="button" :disabled="product.stock === 0" @click="add">Adicionar ao carrinho <span aria-hidden="true">+</span></button>
          <p v-if="message" class="inline-feedback" role="status">{{ message }} <RouterLink to="/carrinho">Ver carrinho →</RouterLink></p>
          <p class="details-footnote">Produto fictício para fins de estudo. Nenhuma venda real é realizada.</p>
        </div>
      </div>
    </div>
    <div v-else class="empty-state"><h1>Produto não encontrado</h1><RouterLink class="button button-primary" to="/">Voltar ao catálogo</RouterLink></div>
  </div>
</template>
