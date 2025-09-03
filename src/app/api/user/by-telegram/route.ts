import { NextResponse } from 'next/server';
import { findUserByTelegramId } from '@/lib/users';

// GET /api/user/by-telegram?userId=123
// Returns: { ok: boolean, user?: {...} | null, error?: string }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
    const user = await findUserByTelegramId(userId);
    if (!user) return NextResponse.json({ ok: true, user: null });
    const normalized = {
      telegramUserId: user.telegram_user_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      customerName: user.first_name, // no separate customer name stored yet
      phone: user.phone,
      email: user.email,
      language: user.language_code,
  chatId: user.chat_id,
    };
    return NextResponse.json({ ok: true, user: normalized });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
