import { NextResponse } from 'next/server';

// GET /api/user/by-telegram?userId=123
// Returns: { ok: boolean, user?: {...} | null, error?: string }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    }

    const endpoint = process.env.ORDERS_EXPORT_URL || process.env.ORDERS_WEBHOOK_URL;
    if (!endpoint) {
      return NextResponse.json({ ok: false, error: 'ORDERS_EXPORT_URL or ORDERS_WEBHOOK_URL not configured' }, { status: 500 });
    }

    const url = new URL(endpoint);
    url.searchParams.set('telegramUserId', userId);
    url.searchParams.set('userProfile', '1');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Upstream error ${res.status}` }, { status: 500 });
    }

  let data: unknown;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid upstream JSON' }, { status: 500 });
    }

  const user = data && typeof data === 'object' && 'user' in (data as Record<string, unknown>) ? (data as Record<string, unknown>)['user'] : data;

    if (user && typeof user === 'object') {
  const u = user as Record<string, unknown>;
      const pick = (k: string) => u[k] ?? u[k.toLowerCase()] ?? '';
      const normalized = {
        telegramUserId: String(pick('telegram_user_id') || userId),
        username: pick('telegram_username'),
        firstName: pick('telegram_first_name'),
        lastName: pick('telegram_last_name'),
        customerName: pick('customer_name'),
        phone: pick('customer_phone'),
        email: pick('customer_email'),
        language: pick('language'),
        ordersCount: Number(pick('orders_count') || 0),
        lastOrderId: pick('last_order_id'),
        lastOrderTimestamp: pick('last_order_timestamp')
      };
      return NextResponse.json({ ok: true, user: normalized });
    }

    return NextResponse.json({ ok: true, user: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
