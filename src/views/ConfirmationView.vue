<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { formatCurrency, formatDate } from '@/utils/format';
import type { PaymentMethod } from '@/types/Order';

const route = useRoute();
const orders = useOrderStore();
const order = computed(() => orders.findOrder(String(route.params.id)));
const paymentNames: Record<PaymentMethod, string> = { pix: 'PIX fictício', cartao: 'Cartão simulado', boleto: 'Boleto fictício' };
</script>

<template>
  <div class="container inner-page">
    <div v-if="order" class="confirmation-card"><div class="confirmation-symbol">✓</div><span class="section-eyebrow">PEDIDO REGISTRADO</span><h1>Pedido criado com sucesso!</h1><p>Esta compra foi simulada e armazenada somente no navegador. Nenhuma cobrança foi realizada.</p>
      <div class="confirmation-number"><span>Número do pedido</span><strong>{{ order.id }}</strong></div>
      <div class="confirmation-details"><div><span>Data</span><strong>{{ formatDate(order.createdAt) }}</strong></div><div><span>Cliente</span><strong>{{ order.customer.name }}</strong></div><div><span>Pagamento</span><strong>{{ paymentNames[order.paymentMethod] }}</strong></div><div><span>Status</span><strong class="status-pill">Simulado · sem cobrança</strong></div></div>
      <div class="confirmation-products"><h2>Itens do pedido</h2><div v-for="item in order.items" :key="item.id" class="confirmation-product"><img :src="item.imageUrl" :alt="item.name"/><span>{{ item.quantity }}× {{ item.name }}</span><strong>{{ formatCurrency(item.price * item.quantity) }}</strong></div></div>
      <div class="confirmation-total"><span>Total demonstrativo</span><strong>{{ formatCurrency(order.total) }}</strong></div>
      <RouterLink to="/" class="button button-primary confirmation-button">Voltar ao catálogo <span aria-hidden="true">→</span></RouterLink>
    </div>
    <div v-else class="empty-state"><h1>Pedido não encontrado</h1><p>Ele pode ter sido apagado ao limpar os dados do navegador.</p><RouterLink to="/" class="button button-primary">Voltar à loja</RouterLink></div>
  </div>
</template>
