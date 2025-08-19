'use client';

import { useTelegram } from '@/hooks/useTelegram';
import { useMessages } from '@/hooks/useMessages';
import { useLang } from '@/contexts/LangContext';

export default function TelegramGreeting() {
  const { tg } = useTelegram();
  const { t } = useMessages();
  const { lang } = useLang();
  const user = tg?.initDataUnsafe?.user;
  if (!user) return null;
  const handle = user.username ? `@${user.username}` : [user.first_name, user.last_name].filter(Boolean).join(' ');
  if (!handle) return null;
  return (
    <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--tg-bg)' }}>
      <p className="text-sm" style={{ color: 'var(--tg-text)' }}>
        {t('greeting.welcome', lang === 'de' ? 'Willkommen' : 'Welcome')}, <span className="font-semibold">{handle}</span>
      </p>
    </div>
  );
}
