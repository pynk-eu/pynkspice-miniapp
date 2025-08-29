/**
 * Telegram admin notification helper.
 * Requires environment variables:
 *  - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 *  - TELEGRAM_ADMIN_CHAT_ID: Numeric chat id of the admin user (or group/channel id)
 */
export async function sendTelegramAdminMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID env; skipping notification');
    }
    return { skipped: true } as const;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const raw = await res.text();
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[telegram] sendMessage failed', res.status, raw);
      }
      return { ok: false, status: res.status, body: raw } as const;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[telegram] notification sent');
    }
    return { ok: true } as const;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[telegram] sendMessage error', err);
    }
    return { ok: false, error: (err instanceof Error ? err.message : String(err)) } as const;
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
