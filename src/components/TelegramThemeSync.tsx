"use client";

import { useEffect } from "react";
import { useTelegram } from "@/hooks/useTelegram";

export default function TelegramThemeSync() {
  const { tg } = useTelegram();
  useEffect(() => {
    if (!tg || !tg.themeParams) return;
    const p = tg.themeParams;
    const root = document.documentElement;
    if (p.bg_color) root.style.setProperty('--tg-bg', p.bg_color);
    if (p.text_color) root.style.setProperty('--tg-text', p.text_color);
    if (p.hint_color) root.style.setProperty('--tg-hint', p.hint_color);
    if (p.link_color) root.style.setProperty('--tg-link', p.link_color);
    if (p.button_color) root.style.setProperty('--tg-button', p.button_color);
    if (p.button_text_color) root.style.setProperty('--tg-button-text', p.button_text_color);
  }, [tg]);
  return null;
}
