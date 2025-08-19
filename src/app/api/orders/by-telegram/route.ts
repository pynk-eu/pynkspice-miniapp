import { NextResponse } from 'next/server';

// Contract: GET /api/orders/by-telegram?userId=123
// Returns: { ok: boolean, orders?: any[], error?: string }

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

  // Try to fetch JSON export. Google Apps Script doGet supports telegramUserId/userId filtering.
  const url = new URL(endpoint);
  url.searchParams.set('telegramUserId', userId);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: `Export error: ${res.status} ${text}` }, { status: 500 });
    }

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // If not JSON, try plain text CSV (not supported yet)
      const text = await res.text();
      return NextResponse.json({ ok: false, error: 'Unsupported export format. Provide JSON endpoint via ORDERS_EXPORT_URL.', raw: text }, { status: 500 });
    }

    // If the endpoint returns an object with rows, unwrap; else if array, use directly
    const rowsUnknown = Array.isArray(data)
      ? data
      : (typeof data === 'object' && data !== null ? (data as { rows?: unknown }).rows : undefined);
    if (!Array.isArray(rowsUnknown)) {
      return NextResponse.json({ ok: false, error: 'Malformed export response' }, { status: 500 });
    }

    // Helpers to coerce values
    const toStr = (v: unknown) => (v == null ? '' : String(v));
    const toNum = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // Helper to safely access keys
    const get = (obj: Record<string, unknown>, key: string) => obj[key];

    // Normalize to a common shape for UI consumption
    const orders = rowsUnknown.map((row) => {
      const r = (typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {});
      return {
        orderId: toStr(get(r, 'order_id') ?? get(r, 'orderId')),
        timestamp: toStr(get(r, 'timestamp') ?? get(r, 'date') ?? get(r, 'created_at')),
        customer: {
          name: toStr(get(r, 'customer_name')),
          phone: toStr(get(r, 'customer_phone')),
          email: toStr(get(r, 'customer_email')),
        },
        delivery: {
          method: toStr(get(r, 'delivery_method')),
          address: {
            street: toStr(get(r, 'address_street')),
            number: toStr(get(r, 'address_number')),
            pincode: toStr(get(r, 'address_pincode')),
            city: toStr(get(r, 'address_city')),
          },
        },
        item: {
          id: (get(r, 'item_id') as string | number),
          name: toStr(get(r, 'item_name')),
          price: toNum(get(r, 'item_price')),
          quantity: toNum(get(r, 'quantity')),
        },
        total: toNum(get(r, 'total')),
        status: toStr(get(r, 'status')) || 'new',
        review: toStr(get(r, 'review')),
        telegramUserId: toStr(get(r, 'telegram_user_id') ?? get(r, 'telegramUserId')),
      };
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
