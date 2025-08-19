'use client';

import Link from 'next/link';
import { useTelegram } from '@/hooks/useTelegram';
import { useMessages } from '@/hooks/useMessages';
import { useLang } from '@/contexts/LangContext';

export default function TelegramOrdersLink() {
  const { tg } = useTelegram();
  const { t } = useMessages();
  const { lang } = useLang();
  if (!tg) return null;
  return (
    <Link href="/orders" className="text-sm font-medium" style={{ color: 'var(--tg-link)' }}>
      {t('nav.order_history', lang === 'de' ? 'Bestellverlauf' : 'Order history')}
    </Link>
  );
}
