import { NextResponse } from 'next/server';
import { postOrderToWebhook, type OrderPayload } from '@/lib/sheets';
import { sendTelegramAdminMessage, formatOrderNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as OrderPayload;
    const url = process.env.ORDERS_WEBHOOK_URL;
    if (!url) {
      return NextResponse.json({ ok: false, error: 'ORDERS_WEBHOOK_URL not configured' }, { status: 500 });
    }

    const res = await postOrderToWebhook(url, {
      ...payload,
      timestamp: new Date().toISOString(),
    });

  let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore non-JSON bodies
    }

    if (!res.ok) {
      const text = body ? JSON.stringify(body) : await res.text();
      return NextResponse.json({ ok: false, error: `Webhook error: ${res.status} ${text}` }, { status: 500 });
    }

    // Fire and forget Telegram admin notification (don't block response)
    try {
      const orderId = (() => {
        if (body && typeof body === 'object' && 'orderId' in body) {
          const v = (body as Record<string, unknown>).orderId;
          if (typeof v === 'string' || typeof v === 'number') return v;
        }
        return undefined;
      })();
      const text = formatOrderNotification({
        orderId,
        items: payload.items.map(i => ({ name: i.name, quantity: i.quantity })),
        total: payload.total,
      });
      // Avoid awaiting; but ensure promise rejection is handled
      sendTelegramAdminMessage(text).catch(() => {});
    } catch {}

    return NextResponse.json({ ok: true, ...((body && typeof body === 'object') ? (body as Record<string, unknown>) : {}) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
