'use client';

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { Lang } from '@/types/index';

type Ctx = { lang: Lang; setLang: (l: Lang) => void };

const LangContext = createContext<Ctx | undefined>(undefined);

export const useLang = (): Ctx => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
};

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('de'); // default German

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('lang') as Lang | null) : null;
    if (saved === 'de' || saved === 'en') setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lang', lang);
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
};
