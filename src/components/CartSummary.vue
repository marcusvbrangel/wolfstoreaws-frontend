<script setup lang="ts">
import { useCartStore } from '@/stores/cartStore';
import { formatCurrency } from '@/utils/format';
const cart = useCartStore();
defineProps<{ checkoutButton?: boolean }>();
</script>

<template>
  <aside class="summary-card">
    <h2>Resumo do pedido</h2>
    <div class="summary-line"><span>Produtos ({{ cart.itemCount }})</span><strong>{{ formatCurrency(cart.subtotal) }}</strong></div>
    <div class="summary-line"><span>Entrega demonstrativa</span><strong :class="{ 'text-green': cart.shipping === 0 }">{{ cart.shipping === 0 ? 'Grátis' : formatCurrency(cart.shipping) }}</strong></div>
    <div class="summary-total"><span>Total</span><strong>{{ formatCurrency(cart.total) }}</strong></div>
    <p class="summary-note">Frete fictício grátis a partir de R$ 299. Valores de demonstração.</p>
    <RouterLink v-if="checkoutButton && cart.itemCount > 0" class="button button-primary button-wide" to="/checkout">Continuar para checkout <span aria-hidden="true">→</span></RouterLink>
  </aside>
</template>
