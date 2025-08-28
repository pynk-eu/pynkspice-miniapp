import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || body.action !== 'registerUser') {
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }
    const url = process.env.ORDERS_WEBHOOK_URL;
    if (!url) return NextResponse.json({ ok: false, error: 'ORDERS_WEBHOOK_URL not configured' }, { status: 500 });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  let data: unknown = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) return NextResponse.json({ ok: false, error: 'Upstream error' }, { status: 500 });
    return NextResponse.json({ ok: true, ...(data || {}) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
