import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/orders';
import { findUserByTelegramId } from '@/lib/users';
import { sendUserMessage, formatUserStatusUpdate } from '@/lib/telegramBot';

export async function POST(req: Request) {
  try {
    const adminKey = process.env.ADMIN_API_KEY;
    const provided = req.headers.get('x-admin-key');
    if (!adminKey || provided !== adminKey) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { orderId, status } = body || {};
    if (!orderId || !status) return NextResponse.json({ ok: false, error: 'Missing orderId/status' }, { status: 400 });
    const updated = await updateOrderStatus(String(orderId), String(status));
    if (!updated) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    if (updated.telegram_user_id) {
      try {
        const user = await findUserByTelegramId(updated.telegram_user_id);
        if (user?.chat_id) {
          await sendUserMessage(user.chat_id, formatUserStatusUpdate(updated.public_code, updated.status));
        }
      } catch {}
    }
    return NextResponse.json({ ok: true, orderId: updated.public_code, status: updated.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
