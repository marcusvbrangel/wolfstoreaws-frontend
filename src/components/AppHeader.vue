<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore';
const cart = useCartStore();
</script>

<template>
  <header class="site-header">
    <div class="header-inner container">
      <RouterLink to="/" class="brand" aria-label="Wolf Store, voltar ao catálogo">
        <img src="/assets/wolf-mark.svg" alt="" class="brand-mark" />
        <span class="brand-name">WOLF<span> STORE</span><small>TECH & GEAR</small></span>
      </RouterLink>
      <nav class="header-nav" aria-label="Navegação principal">
        <RouterLink to="/" class="nav-link" active-class="nav-active">Catálogo</RouterLink>
        <RouterLink to="/carrinho" class="cart-link" aria-label="Ver carrinho">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
          <span>Carrinho</span>
          <span class="cart-counter">{{ cart.itemCount }}</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
