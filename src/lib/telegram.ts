/**
 * Telegram admin notification helper.
 * Requires environment variables:
 *  - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 *  - TELEGRAM_ADMIN_CHAT_ID: Numeric chat id of the admin user (or group/channel id)
 */
export async function sendTelegramAdminMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return { skipped: true } as const;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status } as const;
    }
    return { ok: true } as const;
  } catch {
    return { ok: false } as const;
  }
}

export function formatOrderNotification(params: { orderId?: string | number; items: Array<{ name: string; quantity: number }>; total?: number }) {
  const { orderId, items, total } = params;
  if (!items.length) return 'New order received.';
  const first = items[0];
  const moreCount = items.length - 1;
  const itemsPart = moreCount > 0
    ? `${first.name} (x${first.quantity}) + ${moreCount} more item${moreCount > 1 ? 's' : ''}`
    : `${first.name} (x${first.quantity})`;
  const totalPart = typeof total === 'number' ? ` Total: €${total.toFixed(2)}` : '';
  return `New order${orderId ? ' #' + orderId : ''} received: ${itemsPart}.${totalPart}`;
}
