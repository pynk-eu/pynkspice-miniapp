'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { getMessages, t as translate, type Messages } from '@/lib/i18n';

export function useMessages() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<Messages>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getMessages(lang)
      .then((m) => mounted && setMessages(m))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [lang]);

  const t = (key: string, fallback?: string) => translate(messages, key, fallback);
  return { t, loading };
}
