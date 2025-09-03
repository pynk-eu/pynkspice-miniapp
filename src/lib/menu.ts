import { sql } from './db';

export interface MenuItemRecord {
  id: number;
  name_en: string;
  name_de: string;
  description_en: string | null;
  description_de: string | null;
  ingredients_en: string[];
  ingredients_de: string[];
  spicy_level: number;
  price_cents: number;
  images: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export async function listActiveMenuItems(): Promise<MenuItemRecord[]> {
  const rows = await sql`SELECT * FROM menu_items WHERE active ORDER BY id`;
  return rows as MenuItemRecord[];
}

export async function getMenuItemsByIds(ids: number[]): Promise<MenuItemRecord[]> {
  if (!ids.length) return [];
  const rows = await sql`SELECT * FROM menu_items WHERE id = ANY(${ids}::int[]) AND active`;
  return rows as MenuItemRecord[];
}

export interface CreateMenuItemInput {
  name_en: string; name_de: string;
  description_en?: string; description_de?: string;
  ingredients_en?: string[]; ingredients_de?: string[];
  spicy_level?: number; price_euros: number;
  images?: string[]; active?: boolean;
}

export async function createMenuItem(input: CreateMenuItemInput) {
  const price_cents = Math.round(input.price_euros * 100);
  const rows = await sql`
    INSERT INTO menu_items (name_en, name_de, description_en, description_de, ingredients_en, ingredients_de, spicy_level, price_cents, images, active)
    VALUES (${input.name_en}, ${input.name_de}, ${input.description_en || null}, ${input.description_de || null}, ${input.ingredients_en || []}, ${input.ingredients_de || []}, ${input.spicy_level ?? 0}, ${price_cents}, ${input.images || []}, ${input.active ?? true})
    RETURNING *;
  `;
  return (rows as MenuItemRecord[])[0];
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> { id: number; }

export async function updateMenuItem(input: UpdateMenuItemInput) {
  const existing = await sql`SELECT * FROM menu_items WHERE id = ${input.id} LIMIT 1` as MenuItemRecord[];
  if (!existing.length) return null;
  const cur = existing[0];
  const price_cents = input.price_euros != null ? Math.round(input.price_euros * 100) : cur.price_cents;
  const rows = await sql`
    UPDATE menu_items SET
      name_en = ${input.name_en ?? cur.name_en},
      name_de = ${input.name_de ?? cur.name_de},
      description_en = ${input.description_en ?? cur.description_en},
      description_de = ${input.description_de ?? cur.description_de},
      ingredients_en = ${input.ingredients_en ?? cur.ingredients_en},
      ingredients_de = ${input.ingredients_de ?? cur.ingredients_de},
      spicy_level = ${input.spicy_level ?? cur.spicy_level},
      price_cents = ${price_cents},
      images = ${input.images ?? cur.images},
      active = ${input.active ?? cur.active},
      updated_at = now()
    WHERE id = ${input.id}
    RETURNING *;
  `;
  return (rows as MenuItemRecord[])[0] || null;
}

export async function deleteMenuItem(id: number) {
  const rows = await sql`DELETE FROM menu_items WHERE id = ${id} RETURNING id` as { id: number }[];
  return rows.length > 0;
}
