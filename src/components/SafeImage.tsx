'use client';

import React, { useMemo, useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

function deriveDriveAlternates(url: string): string[] {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    let id: string | null = null;

    if (h === 'drive.google.com') {
      if (u.pathname === '/uc') {
        id = u.searchParams.get('id');
      } else {
        const parts = u.pathname.split('/');
        const dIdx = parts.indexOf('d');
        if (dIdx !== -1 && parts[dIdx + 1]) id = parts[dIdx + 1];
      }
      if (!id) id = u.searchParams.get('id');
    }

    if (!id) return [];

    return [
      `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
      `https://drive.google.com/uc?export=download&id=${id}`,
      `https://drive.google.com/uc?export=view&id=${id}`,
    ];
  } catch {
    return [];
  }
}

export default function SafeImage({ src, alt = '', className = '', fallbackSrc = '/thePynkSpice_logo.jpg', referrerPolicy = 'no-referrer', crossOrigin = 'anonymous', ...rest }: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const [idx, setIdx] = useState(0);
  const candidates = useMemo(() => {
    const s = typeof src === 'string' ? src : '';
    const alts = deriveDriveAlternates(s);
    const proxied = (u: string) => `/api/image?src=${encodeURIComponent(u)}`;
    const list = [s, ...alts].filter(Boolean).map((u) => {
      try {
        const host = new URL(u).hostname.toLowerCase();
        if (
          host === 'drive.google.com' ||
          host.endsWith('.googleusercontent.com') ||
          host === 'googleusercontent.com'
        ) {
          return proxied(u);
        }
        return u;
      } catch {
        return u;
      }
    });
    // de-duplicate
    return Array.from(new Set(list));
  }, [src]);
  const displaySrc = useFallback ? fallbackSrc : candidates[idx] || '';
  return (
    <img
      {...rest}
      src={displaySrc}
      alt={alt}
      className={className}
      referrerPolicy={referrerPolicy}
      crossOrigin={crossOrigin}
      onError={() => {
        if (idx < candidates.length - 1) setIdx((i) => i + 1);
        else setUseFallback(true);
      }}
    />
  );
}
