import { NextResponse } from 'next/server';
import { requestReview, submitReview } from '@/lib/orders';
import { findUserByTelegramId } from '@/lib/users';
import { sendUserMessage, formatReviewRequest } from '@/lib/telegramBot';
import { sendAdminMessage } from '@/lib/telegramBot';

// Actions: request (request a review), submit (user submits review)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, orderId, rating, comment, adminKey } = body || {};
    if (!action || !orderId) return NextResponse.json({ ok: false, error: 'Missing action/orderId' }, { status: 400 });

    if (action === 'request') {
      if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      const row = await requestReview(String(orderId));
      if (row?.telegram_user_id) {
        try {
          const user = await findUserByTelegramId(row.telegram_user_id);
          if (user?.chat_id) await sendUserMessage(user.chat_id, formatReviewRequest(String(orderId)));
        } catch {}
      }
      return NextResponse.json({ ok: true });
    }
    if (action === 'submit') {
      const row = await submitReview(String(orderId), rating != null ? Number(rating) : undefined, comment);
      if (!row) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      await sendAdminMessage(`Review for #${orderId}: rating=${rating ?? 'n/a'} comment=${comment || ''}`);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}