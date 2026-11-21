<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore';
import CartItem from '@/components/CartItem.vue';
import CartSummary from '@/components/CartSummary.vue';
const cart = useCartStore();
</script>

<template>
  <div class="container inner-page">
    <nav class="breadcrumbs"><RouterLink to="/">Catálogo</RouterLink><span>/</span><strong>Meu carrinho</strong></nav>
    <div class="page-title-row"><div><span class="section-eyebrow">SUA SELEÇÃO</span><h1>Meu carrinho<span class="heading-dot">.</span></h1><p>Confira os produtos antes de finalizar sua compra simulada.</p></div><RouterLink to="/" class="back-link">← Continuar comprando</RouterLink></div>
    <div v-if="cart.itemCount > 0" class="cart-layout"><section class="cart-items-panel" aria-label="Produtos do carrinho"><CartItem v-for="item in cart.detailedItems" :key="item.id" :item="item" @quantity="cart.setQuantity" @remove="cart.removeItem" /><button type="button" class="text-remove clear-cart" @click="cart.clearCart">Esvaziar carrinho</button></section><CartSummary checkout-button /></div>
    <div v-else class="empty-state cart-empty"><div class="empty-icon">🛒</div><h2>Seu carrinho está vazio</h2><p>Explore o catálogo e escolha os produtos que quiser.</p><RouterLink class="button button-primary" to="/">Ver produtos →</RouterLink></div>
  </div>
</template>
