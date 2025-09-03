import { NextResponse } from 'next/server';
import { sendAdminMessage, formatOrderMessage } from '@/lib/telegramBot';
import { createOrder } from '@/lib/orders';
import { IncomingOrderSchema, IncomingOrder } from '../../../lib/validation';
import { findUserByTelegramId } from '@/lib/users';
import { sendUserMessage, formatUserOrderConfirmation } from '@/lib/telegramBot';

// Validation moved to zod schema.

export async function POST(req: Request) {
  try {
  const body = await req.json();
  const parsed = IncomingOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  const payload: IncomingOrder = parsed.data;

    const created = await createOrder({
  items: payload.items.map((i: IncomingOrder['items'][number]) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, name_de: i.name_de, image: i.images?.[0] })),
      telegramUserId: payload.telegramUserId,
      customer: payload.customer,
      notes: payload.notes,
      deliveryMethod: payload.delivery?.method || 'pickup',
      totalClient: payload.total,
      telegramUsername: payload.telegramUsername,
      telegramFirstName: payload.telegramFirstName,
      telegramLastName: payload.telegramLastName,
    });

    const msg = formatOrderMessage({
      orderId: created.public_code,
      items: created.items.map(i => ({ name: i.item_name, quantity: i.quantity })),
      total: created.total_cents / 100,
      customerName: payload.customer?.name,
    });
    const telegramResult = await sendAdminMessage(msg);

    // Notify user directly if we have chat id
    if (payload.telegramUserId) {
      try {
        const user = await findUserByTelegramId(String(payload.telegramUserId));
        if (user?.chat_id) {
          const userText = formatUserOrderConfirmation({
            orderId: created.public_code,
            items: created.items.map(i => ({ name: i.item_name, quantity: i.quantity })),
            total: created.total_cents / 100,
          });
            await sendUserMessage(user.chat_id, userText);
        }
      } catch {}
    }

  return NextResponse.json({ ok: true, orderId: created.public_code, id: created.id, total: created.total_cents / 100, createdAt: created.created_at, telegram: telegramResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
