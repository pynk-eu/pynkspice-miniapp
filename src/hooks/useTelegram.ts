import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

type MainButton = {
  isVisible: boolean;
  setText: (text: string) => void;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
  setParams?: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
};

type ThemeParams = Partial<{
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
}>;

export type TelegramWebApp = {
  MainButton: MainButton;
  themeParams?: ThemeParams;
  ready: () => void;
  isExpanded?: boolean;
  expand?: () => void;
  close?: () => void;
  sendData?: (data: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
};

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
  if (typeof window === 'undefined') return;
    if (window.Telegram?.WebApp) {
      setTg(window.Telegram.WebApp as TelegramWebApp);
    }
  }, []);

  return { tg, isTelegram: !!tg } as const;
}
