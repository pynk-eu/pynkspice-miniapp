'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

type OrderRow = {
  orderId: string;
  timestamp?: string;
  item: { id: string | number; name: string; price: number; quantity: number };
  total: number;
  status?: string;
};

export default function OrdersPage() {
  const { tg } = useTelegram();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const userId = tg?.initDataUnsafe?.user?.id;

  const groupByOrder = useMemo(() => {
    const map = new Map<string, OrderRow[]>();
    for (const r of rows) {
      const k = r.orderId || 'unknown';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries())
      .map(([orderId, items]) => ({
        orderId,
        timestamp: items[0]?.timestamp,
        items,
        total: items[0]?.total || items.reduce((s, it) => s + it.item.price * it.item.quantity, 0),
        status: items[0]?.status || 'new',
      }))
      .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
      .reverse();
  }, [rows]);

  useEffect(() => {
    let aborted = false;
    async function load() {
      try {
        setError(null);
        setRows([]);
        if (!userId) return;
        const res = await fetch(`/api/orders/by-telegram?userId=${encodeURIComponent(String(userId))}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load orders');
        if (aborted) return;
        setRows(data.orders || []);
      } catch (e) {
        if (aborted) return;
        setError(e instanceof Error ? e.message : 'Failed to load');
      }
    }
    load();
    return () => { aborted = true; };
  }, [userId]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Your Orders</h1>
      {!userId && (
        <p className="text-gray-600">Open this page inside Telegram to see your order history.</p>
      )}
      {error && <p className="text-red-600">{error}</p>}
      {userId && !error && groupByOrder.length === 0 && (
        <p className="text-gray-600">No orders yet.</p>
      )}

      <div className="space-y-4">
        {groupByOrder.map((o) => (
          <div key={o.orderId} className="bg-white rounded-xl ring-1 ring-gray-100 p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-semibold text-gray-900">Order #{o.orderId}</span>
                {o.timestamp && <span className="ml-2">{new Date(o.timestamp).toLocaleString()}</span>}
              </div>
              <div className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{o.status}</div>
            </div>
            <ul className="mt-3 divide-y divide-gray-100">
              {o.items.map((r, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between text-sm">
                  <div className="truncate mr-3">{r.item.name}</div>
                  <div className="text-gray-600">x{r.item.quantity}</div>
                  <div className="font-medium text-gray-900">€{(r.item.price * r.item.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
            <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span>€{Number(o.total || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
