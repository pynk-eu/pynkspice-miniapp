import type { MenuItem } from '@/types/index';
import { listActiveMenuItems } from '@/lib/menu';

const fallbackMenuItems: MenuItem[] = [
  {
    id: 1,
    name: { en: 'Samosa Chaat', de: 'Samosa Chaat' },
    description: {
      en: 'Crispy samosas crushed and topped with yogurt, chutneys, and spices. A savory and tangy delight.',
      de: 'Knusprige Samosas mit Joghurt, Chutneys und Gewürzen – herzhaft und würzig.',
    },
    ingredients: {
      en: ['Samosa', 'Yogurt', 'Tamarind Chutney', 'Mint Chutney', 'Onions', 'Spices'],
      de: ['Samosa', 'Joghurt', 'Tamarinden-Chutney', 'Minz-Chutney', 'Zwiebeln', 'Gewürze'],
    },
    price: 8.5,
    images: ['/thePynkSpice_logo.jpg'],
  },
  {
    id: 2,
    name: { en: 'Paneer Butter Masala', de: 'Paneer Butter Masala' },
    description: {
      en: 'Creamy tomato-based curry with soft paneer cubes, best enjoyed with naan or rice.',
      de: 'Cremiges Tomaten-Curry mit zartem Paneer, ideal mit Naan oder Reis.',
    },
    ingredients: {
      en: ['Paneer', 'Tomato', 'Cream', 'Butter', 'Spices'],
      de: ['Paneer', 'Tomate', 'Sahne', 'Butter', 'Gewürze'],
    },
    price: 14.0,
    images: ['/thePynkSpice_logo.jpg'],
    maxQuantity: -1,
  },
  {
    id: 3,
    name: { en: 'Mango Lassi', de: 'Mango Lassi' },
    description: {
      en: 'A refreshing and sweet yogurt-based mango smoothie.',
      de: 'Erfrischender und süßer Joghurt-Mango-Smoothie.',
    },
    ingredients: {
      en: ['Yogurt', 'Mango Pulp', 'Sugar', 'Cardamom'],
      de: ['Joghurt', 'Mango', 'Zucker', 'Kardamom'],
    },
    price: 4.5,
    images: ['/thePynkSpice_logo.jpg'],
  },
];

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const dbItems = await listActiveMenuItems();
    if (dbItems.length) {
      return dbItems.map(mi => ({
        id: mi.id,
        name: { en: mi.name_en, de: mi.name_de },
        description: { en: mi.description_en || '', de: mi.description_de || '' },
        ingredients: { en: mi.ingredients_en, de: mi.ingredients_de },
        price: mi.price_cents / 100,
        images: mi.images.length ? mi.images : ['/thePynkSpice_logo.jpg'],
      }));
    }
  } catch (e) {
    console.error('Failed to load menu from DB, using fallback', e);
  }
  return fallbackMenuItems;
};

export const getMenuItemById = async (id: number): Promise<MenuItem | undefined> => {
  const items = await getMenuItems();
  return items.find((item) => item.id === id);
};
