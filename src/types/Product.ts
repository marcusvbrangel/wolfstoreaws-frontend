export type Category = 'Notebooks' | 'Monitores' | 'Periféricos' | 'Smartphones';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  stock: number;
  imageUrl: string;
  tag?: string;
}

export interface CartEntry {
  productId: string;
  quantity: number;
}

export type CartLine = Product & { quantity: number };
