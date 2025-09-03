import { NextResponse } from 'next/server';
import { upsertUser } from '@/lib/users';
import { sendUserMessage } from '@/lib/telegramBot';

// Telegram will POST updates here when webhook is set.
// Set with: https://api.telegram.org/bot<token>/setWebhook?url=<deploy-url>/api/telegram/webhook

interface TgUser { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string }
interface TgChat { id: number; type: string }
interface TgMessage { message_id: number; from?: TgUser; chat: TgChat; text?: string }
interface TgUpdate { update_id: number; message?: TgMessage; }

export async function POST(req: Request) {
  try {
    const update = (await req.json()) as TgUpdate;
    const msg = update.message;
    if (!msg) return NextResponse.json({ ok: true });
    const from = msg.from;
    const chat = msg.chat;
    if (!from || !chat) return NextResponse.json({ ok: true });

    const text = msg.text || ''; 
    const isStart = text.startsWith('/start');
    if (isStart) {
      // Persist user + chat id
      await upsertUser({
        telegramUserId: String(from.id),
        firstName: from.first_name,
        lastName: from.last_name,
        username: from.username,
        language: from.language_code,
        chatId: chat.id,
      });
      // Send welcome
      await sendUserMessage(chat.id, 'Welcome! I will notify you about your order updates here.');
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'error' }, { status: 200 });
  }
}

export async function GET() {
  // Simple health check
  return NextResponse.json({ ok: true, message: 'Telegram webhook active' });
}