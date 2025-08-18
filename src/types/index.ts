export type Lang = 'en' | 'de';

export interface MenuItem {
  id: number;
  name: { en: string; de: string };
  description: { en: string; de: string };
  ingredients: { en: string[]; de: string[] };
  price: number;
  images: string[]; // one or more URLs
  maxQuantity?: number; // -1 or undefined = unlimited; >= 1 limits quantity
}

export interface CartItem extends MenuItem {
  quantity: number;
}
