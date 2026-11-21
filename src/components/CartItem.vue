<script setup lang="ts">
import type { CartLine } from '@/types/Product';
import { formatCurrency } from '@/utils/format';

defineProps<{ item: CartLine }>();
const emit = defineEmits<{ quantity: [productId: string, quantity: number]; remove: [productId: string] }>();
</script>

<template>
  <div class="cart-item">
    <RouterLink :to="`/produto/${item.id}`" class="cart-item-image"><img :src="item.imageUrl" :alt="item.name" /></RouterLink>
    <div class="cart-item-info">
      <span class="eyebrow">{{ item.category }}</span>
      <RouterLink :to="`/produto/${item.id}`" class="cart-item-name">{{ item.name }}</RouterLink>
      <span class="small-muted">{{ formatCurrency(item.price) }} por unidade</span>
      <button type="button" class="text-remove" @click="emit('remove', item.id)">Remover item</button>
    </div>
    <div class="cart-item-actions">
      <div class="quantity-control" aria-label="Quantidade do produto">
        <button type="button" @click="emit('quantity', item.id, item.quantity - 1)" :aria-label="`Diminuir quantidade de ${item.name}`">−</button>
        <output>{{ item.quantity }}</output>
        <button type="button" :disabled="item.quantity >= item.stock" @click="emit('quantity', item.id, item.quantity + 1)" :aria-label="`Aumentar quantidade de ${item.name}`">+</button>
      </div>
      <strong>{{ formatCurrency(item.price * item.quantity) }}</strong>
    </div>
  </div>
</template>
