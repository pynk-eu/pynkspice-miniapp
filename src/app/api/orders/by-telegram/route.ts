import { NextResponse } from 'next/server';
import { listOrdersByTelegramUser } from '@/lib/orders';

// Contract: GET /api/orders/by-telegram?userId=123
// Returns: { ok: boolean, orders?: any[], error?: string }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    const rows = await listOrdersByTelegramUser(userId);
    interface Row { public_code: string; created_at: string; total_cents: number; status?: string; items: { item_name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[] }
    const orders = (rows as Row[]).map(r => ({
      orderId: r.public_code,
      timestamp: r.created_at,
      total: r.total_cents / 100,
      status: r.status,
      items: r.items?.map(i => ({ name: i.item_name, quantity: i.quantity, unit_price: i.unit_price_cents / 100, line_total: i.line_total_cents / 100 }))
    }));
    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
