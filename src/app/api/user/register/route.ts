import { NextResponse } from 'next/server';
import { upsertUser } from '@/lib/users';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || body.action !== 'registerUser' || !body.telegramUserId) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }
    const user = await upsertUser({
      telegramUserId: String(body.telegramUserId),
      firstName: body.telegramFirstName,
      lastName: body.telegramLastName,
      username: body.telegramUsername,
      phone: body.customerPhone,
      email: body.customerEmail,
      language: body.language,
    });
    return NextResponse.json({ ok: true, user: { id: user.id, telegramUserId: user.telegram_user_id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
