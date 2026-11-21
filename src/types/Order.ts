import type { CartLine } from './Product';

export type PaymentMethod = 'pix' | 'cartao' | 'boleto';

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    city: string;
    state: string;
  };
  paymentMethod: PaymentMethod;
  items: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  status: 'SIMULATED';
}
