<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useProductStore } from '@/stores/productStore';
import type { PaymentMethod } from '@/types/Order';
import { formatCurrency } from '@/utils/format';
import CartSummary from '@/components/CartSummary.vue';

const router = useRouter();
const cart = useCartStore();
const orders = useOrderStore();
const products = useProductStore();
const saving = ref(false);
const refreshing = ref(true);
const catalogReady = ref(false);
const refreshError = ref('');
const refreshNotice = ref('');
const validationError = ref('');
const paymentNames: Record<PaymentMethod, string> = { pix: 'PIX fictício', cartao: 'Cartão simulado', boleto: 'Boleto fictício' };

const form = reactive({
  name: '', email: '', phone: '', zipCode: '', street: '', number: '',
  complement: '', city: '', state: '', paymentMethod: 'pix' as PaymentMethod,
});

async function refreshCheckout() {
  refreshing.value = true;
  catalogReady.value = false;
  refreshError.value = '';
  refreshNotice.value = '';

  try {
    const updated = await products.loadCatalog({ maxAgeMs: 5_000 });
    if (!updated) {
      refreshError.value = products.error || 'Não foi possível atualizar o catálogo.';
      return;
    }

    const result = cart.reconcileWithCatalog();
    if (result.changed) {
      refreshNotice.value = 'O carrinho foi ajustado conforme o catálogo atual. Revise os itens e o total.';
    }
    catalogReady.value = true;
  } finally {
    refreshing.value = false;
  }
}

async function finishOrder() {
  if (cart.itemCount === 0 || saving.value) return;
  saving.value = true;
  validationError.value = '';
  try {
    const updated = await products.loadCatalog({ force: true });
    if (!updated) {
      validationError.value = products.error || 'Não foi possível validar o catálogo. Tente novamente.';
      return;
    }

    const reconciliation = cart.reconcileWithCatalog();
    if (reconciliation.changed) {
      refreshNotice.value = 'O carrinho mudou durante a validação. Revise os itens e confirme novamente.';
      validationError.value = 'O pedido não foi criado porque preços, estoque ou quantidades foram atualizados.';
      return;
    }

    if (cart.itemCount === 0) {
      validationError.value = 'Nenhum item disponível permaneceu no carrinho.';
      return;
    }

    const order = orders.createOrder({
      customer: { name: form.name, email: form.email, phone: form.phone },
      address: {
        zipCode: form.zipCode, street: form.street, number: form.number,
        complement: form.complement, city: form.city, state: form.state.toUpperCase(),
      },
      paymentMethod: form.paymentMethod,
      items: cart.detailedItems.map((item) => ({ ...item })),
      subtotal: cart.subtotal,
      shipping: cart.shipping,
      total: cart.total,
    });
    cart.clearCart();
    void router.replace(`/pedido/${order.id}`);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void refreshCheckout();
});
</script>

<template>
  <div class="container inner-page">
    <nav class="breadcrumbs"><RouterLink to="/">Catálogo</RouterLink><span>/</span><RouterLink to="/carrinho">Carrinho</RouterLink><span>/</span><strong>Checkout</strong></nav>
    <div class="page-title-row"><div><span class="section-eyebrow">ÚLTIMA ETAPA</span><h1>Finalizar pedido<span class="heading-dot">.</span></h1><p>Esta é uma simulação: não há cobrança, autenticação ou envio de dados para servidores.</p></div></div>
    <div v-if="refreshing" class="simulation-notice catalog-refresh-notice" aria-live="polite"><strong>Atualizando checkout</strong><span>Validando produtos, preços e estoque...</span></div>
    <div v-else-if="!catalogReady" class="simulation-notice catalog-refresh-notice" role="alert"><strong>Não foi possível atualizar o checkout</strong><span>{{ refreshError }}</span><button class="button button-secondary" type="button" @click="refreshCheckout">Tentar novamente</button></div>
    <template v-else>
    <div v-if="refreshNotice" class="simulation-notice catalog-refresh-notice" role="status"><strong>Catálogo atualizado</strong><span>{{ refreshNotice }}</span></div>
    <div v-if="cart.itemCount > 0" class="checkout-layout">
      <form id="checkout-form" class="checkout-form" @submit.prevent="finishOrder">
        <section class="form-section"><div class="form-section-title"><span class="section-step">01</span><div><h2>Seus dados</h2><p>Use dados fictícios para testar a aplicação.</p></div></div>
          <div class="form-grid"><label class="field field-full"><span>Nome completo *</span><input v-model.trim="form.name" type="text" autocomplete="off" required minlength="3" placeholder="Ex.: Alex Silva" /></label>
            <label class="field"><span>E-mail *</span><input v-model.trim="form.email" type="email" autocomplete="off" required placeholder="alex@exemplo.com" /></label>
            <label class="field"><span>Telefone (opcional)</span><input v-model.trim="form.phone" type="tel" autocomplete="off" placeholder="(21) 99999-9999" /></label>
          </div>
        </section>
        <section class="form-section"><div class="form-section-title"><span class="section-step">02</span><div><h2>Endereço de entrega</h2><p>Endereço demonstrativo, sem consulta externa de CEP.</p></div></div>
          <div class="form-grid"><label class="field"><span>CEP *</span><input v-model.trim="form.zipCode" type="text" required inputmode="numeric" pattern="[0-9]{5}-?[0-9]{3}" title="Use 8 dígitos, com ou sem hífen" placeholder="12345-678" /></label>
            <label class="field"><span>Número *</span><input v-model.trim="form.number" type="text" required placeholder="123" /></label>
            <label class="field field-full"><span>Rua *</span><input v-model.trim="form.street" type="text" required placeholder="Rua Exemplo" /></label>
            <label class="field field-full"><span>Complemento (opcional)</span><input v-model.trim="form.complement" type="text" placeholder="Apartamento, bloco etc." /></label>
            <label class="field"><span>Cidade *</span><input v-model.trim="form.city" type="text" required placeholder="Sua cidade" /></label>
            <label class="field"><span>Estado (UF) *</span><input v-model.trim="form.state" type="text" required minlength="2" maxlength="2" pattern="[A-Za-z]{2}" title="Informe a sigla de 2 letras, ex.: RJ" placeholder="RJ" /></label>
          </div>
        </section>
        <section class="form-section"><div class="form-section-title"><span class="section-step">03</span><div><h2>Pagamento simulado</h2><p>Escolha apenas a opção. Nenhum pagamento será processado.</p></div></div>
          <div class="payment-options"><label v-for="(label, method) in paymentNames" :key="method" class="payment-option" :class="{ chosen: form.paymentMethod === method }"><input v-model="form.paymentMethod" type="radio" :value="method" name="payment" /><span>{{ label }}</span><span v-if="form.paymentMethod === method" class="payment-tick">✓</span></label></div>
        </section>
        <div class="simulation-notice"><strong>Ambiente de demonstração</strong><span>O pedido ficará armazenado apenas no navegador deste computador. Não informe dados reais de pagamento.</span></div>
        <div v-if="validationError" class="simulation-notice simulation-notice-error" role="alert"><strong>Pedido não confirmado</strong><span>{{ validationError }}</span></div>
        <button class="button button-primary button-wide submit-order" type="submit" :disabled="saving">{{ saving ? 'Registrando pedido...' : `Confirmar pedido de ${formatCurrency(cart.total)}` }} <span aria-hidden="true">→</span></button>
      </form>
      <div class="checkout-side"><CartSummary /><RouterLink to="/carrinho" class="back-link checkout-back">← Voltar para o carrinho</RouterLink></div>
    </div>
    <div v-else class="empty-state"><div class="empty-icon">🛒</div><h2>Seu carrinho está vazio</h2><p>Adicione produtos antes de finalizar um pedido.</p><RouterLink to="/" class="button button-primary">Voltar ao catálogo</RouterLink></div>
    </template>
  </div>
</template>
