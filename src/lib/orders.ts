import { sql } from './db';
import { getMenuItemsByIds } from './menu';
import { findUserByTelegramId } from './users';

export interface CreateOrderItemInput {
  id?: number | string; // optional original id/code
  name: string;
  name_de?: string;
  price: number; // decimal euros
  quantity: number;
  image?: string;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  totalClient?: number; // from client, we will recompute
  telegramUserId?: string | number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  customer?: { name?: string; phone?: string; email?: string; language?: string };
  notes?: string;
  deliveryMethod: 'pickup' | 'delivery';
}

export interface CreatedOrder {
  id: number;
  public_code: string;
  total_cents: number;
  created_at: string;
  status?: string;
  items: Array<{
    id: number;
    item_name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
  }>;
}

function eurosToCents(v: number) { return Math.round(v * 100); }

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  if (!input.items.length) throw new Error('No items');
  const ids = input.items.map(i => typeof i.id === 'string' ? Number(i.id) : (i.id as number));
  const menu = await getMenuItemsByIds(ids);
  const menuMap = new Map<number, { price_cents: number; name_en: string; name_de: string; images: string[] }>();
  for (const m of menu) menuMap.set(m.id, { price_cents: m.price_cents, name_en: m.name_en, name_de: m.name_de, images: m.images });
  const normalized = input.items.map(i => {
    const idNumRaw = typeof i.id === 'string' ? Number(i.id) : i.id;
    const idNum = Number.isFinite(idNumRaw) ? (idNumRaw as number) : -1;
  if (!menuMap.has(idNum)) throw new Error(`Item not found or inactive: ${i.id}`);
  const m = menuMap.get(idNum)!;
  const unitCents = m.price_cents;
    const line = unitCents * i.quantity;
  return { item_code: String(i.id ?? ''), name: m.name_en, name_de: m.name_de, unit_price_cents: unitCents, quantity: i.quantity, line_total_cents: line, image_url: (i.image || m.images[0]) || null };
  });
  const total = normalized.reduce((s, n) => s + n.line_total_cents, 0);
  let userId: number | null = null;
  if (input.telegramUserId) {
    const existing = await findUserByTelegramId(String(input.telegramUserId));
    if (existing) userId = existing.id;
  }
  const item_code_arr = normalized.map(n => n.item_code || null);
  const item_name_arr = normalized.map(n => n.name);
  const item_name_de_arr = normalized.map(n => n.name_de || n.name);
  const unit_price_arr = normalized.map(n => n.unit_price_cents);
  const qty_arr = normalized.map(n => n.quantity);
  const line_total_arr = normalized.map(n => n.line_total_cents);
  const image_arr = normalized.map(n => n.image_url);
  const telegramUserId = input.telegramUserId ? String(input.telegramUserId) : null;
  const rows = await sql`
    WITH seq AS (
      INSERT INTO daily_sequences (seq_date, next_seq)
      VALUES (current_date, 1)
      ON CONFLICT (seq_date)
      DO UPDATE SET next_seq = daily_sequences.next_seq + 1
      RETURNING next_seq
    ),
    ins_order AS (
      INSERT INTO orders (public_code, user_id, telegram_user_id, total_cents, raw_customer_name, raw_customer_phone, raw_customer_email, notes, status, delivery_method)
      SELECT to_char(current_date,'DDMM') || lpad((SELECT next_seq FROM seq)::text, 2, '0'), ${userId}, ${telegramUserId}, ${total}, ${input.customer?.name || null}, ${input.customer?.phone || null}, ${input.customer?.email || null}, ${input.notes || null}, 'new', ${input.deliveryMethod}
      RETURNING id, public_code, total_cents, created_at, status
    ),
    ins_items AS (
      INSERT INTO order_items (order_id, item_code, item_name, item_name_de, unit_price_cents, quantity, line_total_cents, image_url)
      SELECT (SELECT id FROM ins_order), ic, n, nd, u, q, l, img
      FROM UNNEST(
        ${item_code_arr}::text[],
        ${item_name_arr}::text[],
        ${item_name_de_arr}::text[],
        ${unit_price_arr}::int[],
        ${qty_arr}::int[],
        ${line_total_arr}::int[],
        ${image_arr}::text[]
      ) AS t(ic, n, nd, u, q, l, img)
      RETURNING id, item_name, quantity, unit_price_cents, line_total_cents
    )
    SELECT (SELECT json_build_object('id', id, 'public_code', public_code, 'total_cents', total_cents, 'created_at', created_at, 'status', status) FROM ins_order) AS order_row,
           (SELECT json_agg(ins_items) FROM ins_items) AS items;
  `;
  type OrderRowResult = { order_row: { id: number; public_code: string; total_cents: number; created_at: string; status: string }; items: { id: number; item_name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[] };
  const row = (rows as OrderRowResult[])[0];
  const orderRow = row.order_row as { id: number; public_code: string; total_cents: number; created_at: string; status: string };
  const items = (row.items || []) as { id: number; item_name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[];
  return { id: orderRow.id, public_code: orderRow.public_code, total_cents: orderRow.total_cents, created_at: orderRow.created_at, status: orderRow.status, items };
}

export interface OrderListRow { id: number; public_code: string; total_cents: number; created_at: string; status?: string; items: { id: number; item_name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[] }

export async function listOrdersByTelegramUser(telegramUserId: string): Promise<OrderListRow[]> {
  const rows = await sql`
  SELECT o.id, o.public_code, o.total_cents, o.created_at, o.status,
           json_agg(json_build_object(
             'id', i.id,
             'item_name', i.item_name,
             'quantity', i.quantity,
             'unit_price_cents', i.unit_price_cents,
             'line_total_cents', i.line_total_cents
           ) ORDER BY i.id) AS items
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    WHERE o.telegram_user_id = ${telegramUserId}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 50;
  `;
  return rows as OrderListRow[];
}

const ALLOWED_STATUSES = new Set(['new','preparing','ready','fulfilled','cancelled']);

export async function updateOrderStatus(publicCode: string, status: string) {
  if (!ALLOWED_STATUSES.has(status)) throw new Error('Invalid status');
  const rows = await sql`
    UPDATE orders
    SET status = ${status},
        fulfilled_at = CASE WHEN ${status} = 'fulfilled' THEN now() ELSE fulfilled_at END,
        updated_at = now()
    WHERE public_code = ${publicCode}
    RETURNING id, public_code, status, telegram_user_id;
  `;
  return (rows as { id: number; public_code: string; status: string; telegram_user_id: string | null }[])[0] || null;
}

export async function requestReview(publicCode: string) {
  const rows = await sql`
    UPDATE orders SET review_requested_at = now(), updated_at = now()
    WHERE public_code = ${publicCode}
    RETURNING id, public_code, telegram_user_id;
  `;
  return (rows as { id: number; public_code: string; telegram_user_id: string | null }[])[0] || null;
}

export async function submitReview(publicCode: string, rating?: number, comment?: string) {
  if (rating != null && (rating < 1 || rating > 5)) throw new Error('Invalid rating');
  const rows = await sql`
    UPDATE orders SET review_rating = ${rating || null}, review_comment = ${comment || null}, updated_at = now()
    WHERE public_code = ${publicCode}
    RETURNING id, public_code, review_rating, review_comment, telegram_user_id;
  `;
  return (rows as { id: number; public_code: string; review_rating: number | null; review_comment: string | null; telegram_user_id: string | null }[])[0] || null;
}
