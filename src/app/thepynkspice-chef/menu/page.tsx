'use client';
import React, { useEffect, useState, useCallback } from 'react';
import SpicyLevelPicker from '@/components/SpicyLevelPicker';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

interface MenuItemFormState {
  name_en: string;
  name_de: string;
  description_en: string;
  description_de: string;
  ingredients_en: string;
  ingredients_de: string;
  spicy_level: number;
  price_euros: string; // keep as string for controlled input
  images: string;
  active: boolean;
}

export default function MenuManagerPage() {
  const router = useRouter();
  interface MenuItem {
    id: number;
    name_en: string;
    name_de: string;
    spicy_level: number;
    price_cents: number;
    active: boolean;
  }
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<MenuItemFormState>({
    name_en: '',
    name_de: '',
    description_en: '',
    description_de: '',
    ingredients_en: '',
    ingredients_de: '',
    spicy_level: 0,
    price_euros: '',
    images: '',
    active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/admin/menu-items');
    if (r.status === 401) {
      router.replace('/thepynkspice-chef/login');
      return;
    }
    const d = await r.json();
    if (d.ok) setItems(d.items); else setError(d.error || 'Failed to load');
    setLoading(false);
  }, [router]);
  useEffect(() => { load(); }, [load]);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(undefined);
    const payload = {
      name_en: form.name_en.trim(),
      name_de: form.name_de.trim(),
      description_en: form.description_en.trim() || null,
      description_de: form.description_de.trim() || null,
      ingredients_en: form.ingredients_en.split(',').map(s => s.trim()).filter(Boolean),
      ingredients_de: form.ingredients_de.split(',').map(s => s.trim()).filter(Boolean),
      spicy_level: form.spicy_level,
      price_euros: parseFloat(form.price_euros),
      images: form.images.split(',').map(s => s.trim()).filter(Boolean),
      active: form.active,
    } as const;

    const r = await fetch('/api/admin/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.status === 401) {
      router.replace('/thepynkspice-chef/login');
      return;
    }
    const d = await r.json();
    if (!d.ok) {
      setError(d.error || 'Create failed');
    } else {
      setItems(p => [...p, d.item]);
      setForm({
        name_en: '', name_de: '', description_en: '', description_de: '',
        ingredients_en: '', ingredients_de: '', spicy_level: 0,
        price_euros: '', images: '', active: true
      });
    }
    setCreating(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Menu Items</h1>
          <p className="text-gray-600 text-sm">Add and manage dishes shown to customers.</p>
        </div>
        <AdminNav />
      </div>

      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Add New Item</h2>
        <form onSubmit={createItem} className="grid md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name_en" className="block text-sm font-medium mb-1">Name (EN)</label>
            <input
              id="name_en"
              value={form.name_en}
              onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
              required
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>
          <div>
            <label htmlFor="name_de" className="block text-sm font-medium mb-1">Name (DE)</label>
            <input
              id="name_de"
              value={form.name_de}
              onChange={e => setForm(f => ({ ...f, name_de: e.target.value }))}
              required
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>
          <div>
            <label htmlFor="description_en" className="block text-sm font-medium mb-1">Description (EN)</label>
            <textarea
              id="description_en"
              value={form.description_en}
              onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 min-h-24"
            />
          </div>
          <div>
            <label htmlFor="description_de" className="block text-sm font-medium mb-1">Description (DE)</label>
            <textarea
              id="description_de"
              value={form.description_de}
              onChange={e => setForm(f => ({ ...f, description_de: e.target.value }))}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 min-h-24"
            />
          </div>
          <div>
            <label htmlFor="ingredients_en" className="block text-sm font-medium mb-1">Ingredients (EN, comma)</label>
            <input
              id="ingredients_en"
              value={form.ingredients_en}
              onChange={e => setForm(f => ({ ...f, ingredients_en: e.target.value }))}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>
          <div>
            <label htmlFor="ingredients_de" className="block text-sm font-medium mb-1">Ingredients (DE, Komma)</label>
            <input
              id="ingredients_de"
              value={form.ingredients_de}
              onChange={e => setForm(f => ({ ...f, ingredients_de: e.target.value }))}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>
          <div>
            <label htmlFor="spicy_level_picker" className="block text-sm font-medium mb-1">Spicy Level (0–5)</label>
            <SpicyLevelPicker
              value={form.spicy_level}
              onChange={(v: number) => setForm(f => ({ ...f, spicy_level: v }))}
            />
          </div>
          <div>
            <label htmlFor="price_euros" className="block text-sm font-medium mb-1">Price (EUR)</label>
            <input
              id="price_euros"
              type="number"
              step="0.01"
              value={form.price_euros}
              onChange={e => setForm(f => ({ ...f, price_euros: e.target.value }))}
              required
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="images" className="block text-sm font-medium mb-1">Image URLs (comma separated)</label>
            <input
              id="images"
              value={form.images}
              onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
            <p className="text-xs text-gray-500 mt-1">Provide absolute URLs or paths served by the app.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="text-sm font-medium">Active</label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-blue-600 text-white font-medium py-2.5 px-6 disabled:opacity-50"
            >{creating ? 'Creating…' : 'Create Item'}</button>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </form>
      </section>

      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Existing Items</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="divide-y">
            {items.map(it => (
              <li key={it.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{it.name_en} / {it.name_de}</div>
                  <div className="text-xs text-gray-500">Spicy {it.spicy_level} • €{(it.price_cents / 100).toFixed(2)} {it.active ? '' : ' • Inactive'}</div>
                </div>
                <div className="text-xs text-gray-400">#{it.id}</div>
              </li>
            ))}
            {!items.length && <li className="py-3 text-sm text-gray-500">No items yet.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}