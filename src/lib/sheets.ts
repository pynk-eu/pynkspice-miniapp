import type { MenuItem } from '@/types/index';

// Very small CSV parser that supports quoted fields and commas inside quotes
export function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'; // Escaped quote
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
      // swallow consecutive \r\n
      if (char === '\r' && next === '\n') i++;
      continue;
    }

    cell += char;
  }

  // push last cell/row
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

// Convert Google Drive sharing links to direct embeddable image URLs.
export function normalizeDriveImageUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const h = host.toLowerCase();

    // Already a direct googleusercontent link – keep as-is
    if (h.endsWith('googleusercontent.com')) return url;
    // drive.google.com patterns
    if (h === 'drive.google.com') {
      // Pattern: /file/d/<id>/view or /file/d/<id>/preview
      const fileIdx = u.pathname.split('/').indexOf('file');
      if (fileIdx !== -1) {
        const parts = u.pathname.split('/');
        const dIdx = parts.indexOf('d');
        if (dIdx !== -1 && parts[dIdx + 1]) {
          const id = parts[dIdx + 1];
          // Use thumbnail endpoint for a reliable direct image response
          return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
        }
      }

      // Pattern: /open?id=<id>
      const openId = u.searchParams.get('id');
      if (openId) {
        return `https://drive.google.com/thumbnail?id=${openId}&sz=w2000`;
      }

      // Pattern: /uc?id=<id>&export=...  – normalize to export=view
      if (u.pathname === '/uc') {
        const id = u.searchParams.get('id');
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

// Helper: get revalidate seconds from env or default to 60s
const MENU_REVALIDATE_SECONDS = (() => {
  const v = process.env.MENU_REVALIDATE_SECONDS;
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 60;
})();

export async function fetchMenuFromPublishedCSV(url: string): Promise<MenuItem[]> {
  // Use Next.js enhanced fetch with ISR so build does not fail due to dynamic no-store fetch.
  const res = await fetch(url, { next: { revalidate: MENU_REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`Failed to fetch menu CSV: ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text).filter((r) => r.length && r.some((c) => c.trim() !== ''));
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const get = (obj: Record<string, string>, key: string) => obj[key] ?? '';

  const items: MenuItem[] = rows.slice(1).map((r) => {
    const record: Record<string, string> = {};
    header.forEach((h, idx) => {
      record[h] = r[idx] ?? '';
    });

    const id = Number(get(record, 'id')) || Date.now();
    const name_en = get(record, 'name_en') || get(record, 'name') || 'Item';
    const name_de = get(record, 'name_de') || name_en;
    const description_en = get(record, 'description_en') || get(record, 'description') || '';
    const description_de = get(record, 'description_de') || description_en;
    const ingredients_en = (get(record, 'ingredients_en') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ingredients_de = (get(record, 'ingredients_de') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const price = Number(get(record, 'price')) || 0;
    const image_urls = (get(record, 'image_urls') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(normalizeDriveImageUrl);
    const maxQuantityRaw = get(record, 'max_quantity');
    const maxQuantity = maxQuantityRaw === '' || maxQuantityRaw == null ? undefined : Number(maxQuantityRaw) || -1;

    const images = image_urls.length ? image_urls : ['/thePynkSpice_logo.jpg'];

    const item: MenuItem = {
      id,
      name: { en: name_en, de: name_de },
      description: { en: description_en, de: description_de },
      ingredients: { en: ingredients_en, de: ingredients_de },
      price,
      images,
      maxQuantity,
    };

    return item;
  });

  return items;
}

// (Legacy order webhook + payload type removed – DB now source of truth.)
