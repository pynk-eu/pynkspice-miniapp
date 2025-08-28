"use client";
import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useLang } from '@/contexts/LangContext';

export default function TelegramAutoRegister() {
  const { tg } = useTelegram();
  const { lang } = useLang();

  useEffect(() => {
    if (!tg?.initDataUnsafe?.user?.id) return;
    const u = tg.initDataUnsafe.user;
    const controller = new AbortController();
    // Fire and forget registration
    fetch('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'registerUser',
        telegramUserId: u.id,
        telegramUsername: u.username,
        telegramFirstName: u.first_name,
        telegramLastName: u.last_name,
        customer: { language: lang },
      }),
      signal: controller.signal,
    }).catch(() => {});
    return () => controller.abort();
  }, [tg, lang]);

  return null;
}
