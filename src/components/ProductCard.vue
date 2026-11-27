<script setup lang="ts">
import type { Product } from '@/types/Product';
import { formatCurrency } from '@/utils/format';

defineProps<{ product: Product; loading?: boolean }>();
const emit = defineEmits<{ add: [product: Product] }>();
</script>

<template>
  <article class="product-card">
    <RouterLink :to="`/produto/${product.id}`" class="product-image-link" :aria-label="`Ver ${product.name}`">
      <div class="product-image-wrap">
        <img :src="product.imageUrl" :alt="product.name" loading="lazy" width="520" height="420" />
        <span v-if="product.tag" class="product-badge">{{ product.tag }}</span>
      </div>
    </RouterLink>
    <div class="product-card-content">
      <span class="eyebrow">{{ product.category }}</span>
      <RouterLink :to="`/produto/${product.id}`" class="product-name">{{ product.name }}</RouterLink>
      <p class="product-description">{{ product.description }}</p>
      <div class="card-bottom">
        <div class="price-block"><span class="small-muted">À vista</span><strong>{{ formatCurrency(product.price) }}</strong></div>
        <button class="button button-primary add-button" type="button" @click="emit('add', product)" :disabled="product.stock === 0 || loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          {{ loading ? 'Atualizando...' : 'Adicionar' }}
        </button>
      </div>
    </div>
  </article>
</template>
