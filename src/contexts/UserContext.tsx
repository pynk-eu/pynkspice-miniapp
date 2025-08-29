"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

export type UserProfile = {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  language?: string;
  ordersCount?: number;
  lastOrderId?: string;
  lastOrderTimestamp?: string;
};

type UserCtx = {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<UserCtx | undefined>(undefined);

export function useUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { tg } = useTelegram();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchOnce = async () => {
    if (fetched) return; // already fetched this session
    if (!tg?.initDataUnsafe?.user?.id) return; // wait until telegram ready
    setLoading(true);
    setError(null);
    try {
      const id = tg.initDataUnsafe.user.id;
      const res = await fetch(`/api/user/by-telegram?userId=${encodeURIComponent(String(id))}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setFetched(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnce();
    // intentionally exclude fetchOnce dependencies to keep single-run semantics
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg]);

  const refresh = async () => {
    setFetched(false);
    await fetchOnce();
  };

  return <Ctx.Provider value={{ user, loading, error, refresh }}>{children}</Ctx.Provider>;
}
