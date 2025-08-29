import { TelegramBot } from 'typescript-telegram-bot-api';

let botInstance: TelegramBot | null = null;

function getBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  if (!botInstance) {
    botInstance = new TelegramBot({ botToken: token });
  }
  return botInstance;
}

export async function sendAdminMessage(text: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const bot = getBot();
  if (!bot || !chatId) return { skipped: true } as const;
  try {
    await bot.sendMessage({ chat_id: chatId, text });
    return { ok: true } as const;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) } as const;
  }
}

export function formatOrderMessage(order: { orderId?: string | number; items: Array<{ name: string; quantity: number }>; total?: number; customerName?: string }) {
  if (!order.items.length) return 'New order received.';
  const first = order.items[0];
  const more = order.items.length - 1;
  const head = `${first.name} x${first.quantity}` + (more > 0 ? ` +${more} more` : '');
  const total = typeof order.total === 'number' ? ` | Total €${order.total.toFixed(2)}` : '';
  const cust = order.customerName ? ` | ${order.customerName}` : '';
  return `New order${order.orderId ? ' #' + order.orderId : ''}: ${head}${total}${cust}`;
}
