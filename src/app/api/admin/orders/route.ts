import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminSession';
import { sql } from '@/lib/db';
import { createOrder, updateOrderStatus } from '@/lib/orders';

// GET /api/admin/orders -> list recent orders with items & basic customer info
export async function GET() {
  if (!isAdminRequest()) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const rows = await sql`
    SELECT o.id, o.public_code, o.total_cents, o.created_at, o.status,
           o.raw_customer_name, o.raw_customer_phone, o.raw_customer_email, o.delivery_method, o.notes,
           json_agg(json_build_object(
             'id', i.id,
             'item_name', i.item_name,
             'quantity', i.quantity,
             'unit_price_cents', i.unit_price_cents,
             'line_total_cents', i.line_total_cents
           ) ORDER BY i.id) AS items
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 100;
  ` as any[];
  return NextResponse.json({ ok: true, orders: rows.map(r => ({
    id: r.id,
    code: r.public_code,
    created_at: r.created_at,
    status: r.status,
    total: r.total_cents / 100,
    customer: {
      name: r.raw_customer_name || null,
      phone: r.raw_customer_phone || null,
      email: r.raw_customer_email || null,
    },
    delivery_method: r.delivery_method,
    notes: r.notes,
    items: (r.items || []).map((i: any) => ({
      id: i.id,
      name: i.item_name,
      quantity: i.quantity,
      unit_price: i.unit_price_cents / 100,
      line_total: i.line_total_cents / 100
    }))
  })) });
}

// PATCH /api/admin/orders (update status) body: { code, status }
export async function PATCH(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { code, status } = body || {};
    if (!code || !status) return NextResponse.json({ ok: false, error: 'Missing code/status' }, { status: 400 });
    const updated = await updateOrderStatus(String(code), String(status));
    if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, order: updated });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message || 'Error' }, { status: 500 });
  }
}

// POST /api/admin/orders/offline  body: { customerName, phone?, email?, deliveryMethod, items:[{id, quantity}], notes? }
export async function POST(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { customerName, phone, email, deliveryMethod, items, notes } = body || {};
    if (!customerName || !Array.isArray(items) || !items.length) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    const order = await createOrder({
      items: items.map((i:any)=>({ id: i.id, name: '', price: 0, quantity: i.quantity })),
      customer: { name: customerName, phone, email },
      notes,
      deliveryMethod: deliveryMethod === 'delivery' ? 'delivery' : 'pickup'
    });
    return NextResponse.json({ ok: true, order });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || 'Error' }, { status: 500 });
  }
}