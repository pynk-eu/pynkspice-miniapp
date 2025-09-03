import { sql } from './db';

export interface UpsertUserInput {
  telegramUserId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  email?: string;
  language?: string;
  chatId?: string | number; // optional chat id captured from /start
}

export interface AppUser {
  id: number;
  telegram_user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  email: string | null;
  language_code: string | null;
  chat_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertUser(u: UpsertUserInput): Promise<AppUser> {
  const rows = await sql`
    INSERT INTO app_users (telegram_user_id, first_name, last_name, username, phone, email, language_code, chat_id)
    VALUES (${u.telegramUserId}, ${u.firstName || null}, ${u.lastName || null}, ${u.username || null}, ${u.phone || null}, ${u.email || null}, ${u.language || null}, ${u.chatId ? String(u.chatId) : null})
    ON CONFLICT (telegram_user_id)
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      phone = COALESCE(EXCLUDED.phone, app_users.phone),
      email = COALESCE(EXCLUDED.email, app_users.email),
      language_code = COALESCE(EXCLUDED.language_code, app_users.language_code),
      chat_id = COALESCE(app_users.chat_id, EXCLUDED.chat_id),
      updated_at = now()
    RETURNING *
  `;
  return (rows as AppUser[])[0];
}

export async function findUserByTelegramId(telegramUserId: string): Promise<AppUser | null> {
  const rows = await sql`SELECT * FROM app_users WHERE telegram_user_id = ${telegramUserId} LIMIT 1`;
  return (rows as AppUser[])[0] || null;
}
