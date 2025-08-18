import { parseCSV } from '@/lib/sheets';
import type { Lang } from '@/types/index';

export type Messages = Record<string, string>;

let cache: Partial<Record<Lang, Messages>> = {};

export async function fetchTranslations(url: string): Promise<Record<Lang, Messages>> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch i18n CSV: ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text).filter((r) => r.length && r.some((c) => c.trim() !== ''));
  if (rows.length < 2) return { en: {}, de: {} } as Record<Lang, Messages>;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idxKey = header.indexOf('key');
  const idxEn = header.indexOf('en');
  const idxDe = header.indexOf('de');

  const en: Messages = {};
  const de: Messages = {};

  for (const r of rows.slice(1)) {
    const key = (r[idxKey] || '').trim();
    if (!key) continue;
    if (idxEn >= 0) en[key] = (r[idxEn] || '').trim();
    if (idxDe >= 0) de[key] = (r[idxDe] || '').trim();
  }
  return { en, de } as Record<Lang, Messages>;
}

export async function getMessages(lang: Lang): Promise<Messages> {
  if (cache[lang]) return cache[lang]!;
  const url = process.env.I18N_SHEET_CSV_URL;
  if (!url) return {};
  const all = await fetchTranslations(url);
  cache = all;
  return all[lang] || {};
}

export function t(messages: Messages, key: string, fallback?: string) {
  return messages[key] ?? fallback ?? key;
}
