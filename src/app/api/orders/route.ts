import { NextResponse } from 'next/server';
import { postOrderToWebhook, type OrderPayload } from '@/lib/sheets';

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

  return NextResponse.json({ ok: true, ...((body && typeof body === 'object') ? (body as Record<string, unknown>) : {}) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
