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

export async function sendUserMessage(chatId: string | number, text: string) {
  const bot = getBot();
  if (!bot) return { skipped: true } as const;
  try {
    await bot.sendMessage({ chat_id: String(chatId), text });
    return { ok: true } as const;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) } as const;
  }
}

export function formatUserOrderConfirmation(order: { orderId: string; items: Array<{ name: string; quantity: number }>; total: number }) {
  const lines: string[] = [];
  lines.push(`Thank you! Your order #${order.orderId} was received.`);
  lines.push('Items:');
  for (const it of order.items.slice(0, 5)) {
    lines.push(`• ${it.name} x${it.quantity}`);
  }
  if (order.items.length > 5) lines.push(`… and ${order.items.length - 5} more`);
  lines.push(`Total: €${order.total.toFixed(2)}`);
  lines.push('We will update you when it is ready.');
  return lines.join('\n');
}

export function formatUserStatusUpdate(orderId: string, status: string) {
  const map: Record<string, string> = {
    preparing: 'is now being prepared',
    ready: 'is ready for pickup',
    fulfilled: 'has been completed. Enjoy!',
    cancelled: 'was cancelled',
  };
  const phrase = map[status] || `status updated: ${status}`;
  return `Update: Order #${orderId} ${phrase}.`;
}

export function formatReviewRequest(orderId: string) {
  return `We hope you enjoyed your meal! Please rate order #${orderId} (1-5) and optionally add a short comment here.`;
}


