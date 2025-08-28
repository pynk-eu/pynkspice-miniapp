"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/contexts/LangContext";
import { useEffect, useMemo, useState } from "react";

export default function OrderSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params?.get("orderId") || null;
  const total = params?.get("total") || null;
  const { lang } = useLang();
  const [seconds, setSeconds] = useState(10);

  const title = lang === 'de' ? 'Bestellung erfolgreich!' : 'Order placed!';
  const subtitle = lang === 'de' ? 'Danke für Ihre Bestellung.' : 'Thank you for your order.';
  const idLabel = lang === 'de' ? 'Bestellnummer' : 'Order ID';
  const totalLabel = lang === 'de' ? 'Gesamt' : 'Total';
  const backLabel = lang === 'de' ? 'Zur Speisekarte' : 'Back to menu';
  const redirecting = lang === 'de' ? 'Weiterleitung in' : 'Redirecting in';
  const deliveryLabel = lang === 'de' ? 'Lieferart' : 'Delivery';
  const itemsLabel = lang === 'de' ? 'Artikel' : 'Items';

  useEffect(() => {
    // Countdown and auto-redirect
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
  const to = setTimeout(() => router.push('/menu'), 10000);
    return () => {
      clearInterval(tick);
      clearTimeout(to);
    };
  }, [router]);

  // Load a brief order summary stored during checkout
  const summary = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('lastOrderSummary');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        orderId?: string;
        total?: number;
        deliveryMethod?: 'pickup' | 'delivery';
        items?: Array<{ id: number; name: string; price: number; quantity: number }>;
      } | null;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Clean up summary after rendering once
    try {
      sessionStorage.removeItem('lastOrderSummary');
    } catch {}
  }, []);

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 md:p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-7.5 9.5a.75.75 0 0 1-1.128.05l-3.5-3.75a.75.75 0 1 1 1.09-1.03l2.9 3.11 6.96-8.814a.75.75 0 0 1 1.035-.118Z" clipRule="evenodd" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>

        <div className="mt-5 inline-flex flex-col gap-1 text-sm text-gray-700">
          {orderId && (
            <div><span className="font-medium">{idLabel}:</span> <span className="font-mono">{orderId}</span></div>
          )}
          {total && (
            <div><span className="font-medium">{totalLabel}:</span> €{Number(total).toFixed(2)}</div>
          )}
          {summary?.deliveryMethod && (
            <div><span className="font-medium">{deliveryLabel}:</span> {summary.deliveryMethod === 'pickup' ? (lang === 'de' ? 'Abholung' : 'Pickup') : (lang === 'de' ? 'Lieferung' : 'Delivery')}</div>
          )}
        </div>

        {!!summary?.items?.length && (
          <div className="mt-4 text-left">
            <div className="text-sm font-medium text-gray-900 mb-1">{itemsLabel}</div>
            <ul className="text-sm text-gray-700 list-disc pl-5">
              {summary.items.map((it) => (
                <li key={it.id}>
                  {it.quantity} × {it.name} — €{(it.price * it.quantity).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500">{redirecting} {seconds}s…</p>
          <Link href="/menu" className="inline-flex items-center justify-center rounded-full bg-pink-600 text-white font-semibold py-2.5 px-5 hover:bg-pink-700 active:scale-[.98]">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
