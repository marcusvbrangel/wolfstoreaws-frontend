import { createRouter, createWebHistory } from 'vue-router';
import CatalogView from '@/views/CatalogView.vue';
import ProductDetailsView from '@/views/ProductDetailsView.vue';
import CartView from '@/views/CartView.vue';
import CheckoutView from '@/views/CheckoutView.vue';
import ConfirmationView from '@/views/ConfirmationView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: CatalogView, meta: { title: 'Catálogo' } },
    { path: '/produto/:id', component: ProductDetailsView, meta: { title: 'Produto' } },
    { path: '/carrinho', component: CartView, meta: { title: 'Carrinho' } },
    { path: '/checkout', component: CheckoutView, meta: { title: 'Checkout' } },
    { path: '/pedido/:id', component: ConfirmationView, meta: { title: 'Pedido' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.path === from.path) return undefined;
    return { top: 0 };
  },
});

router.afterEach((to) => {
  document.title = `${String(to.meta.title || 'Loja')} | Wolf Store`;
});

export default router;
