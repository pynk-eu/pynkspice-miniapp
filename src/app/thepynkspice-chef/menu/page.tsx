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
    description_en: string | null;
    description_de: string | null;
    ingredients_en: string[];
    ingredients_de: string[];
    spicy_level: number;
    price_cents: number;
    images: string[];
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MenuItemFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

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

  function startEdit(it: MenuItem) {
    setEditingId(it.id);
    setEditForm({
      name_en: it.name_en,
      name_de: it.name_de,
      description_en: it.description_en || '',
      description_de: it.description_de || '',
      ingredients_en: it.ingredients_en.join(', '),
      ingredients_de: it.ingredients_de.join(', '),
      spicy_level: it.spicy_level,
      price_euros: (it.price_cents / 100).toFixed(2),
      images: it.images.join(', '),
      active: it.active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm) return;
    setSavingEdit(true);
    setError(undefined);
    const payload = {
      name_en: editForm.name_en.trim(),
      name_de: editForm.name_de.trim(),
      description_en: editForm.description_en.trim() || null,
      description_de: editForm.description_de.trim() || null,
      ingredients_en: editForm.ingredients_en.split(',').map(s=>s.trim()).filter(Boolean),
      ingredients_de: editForm.ingredients_de.split(',').map(s=>s.trim()).filter(Boolean),
      spicy_level: editForm.spicy_level,
      price_euros: parseFloat(editForm.price_euros),
      images: editForm.images.split(',').map(s=>s.trim()).filter(Boolean),
      active: editForm.active,
    } as const;
    const r = await fetch(`/api/admin/menu-items/${editingId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    if (r.status === 401) { router.replace('/thepynkspice-chef/login'); return; }
    const d = await r.json();
    if (!d.ok) {
      setError(d.error || 'Update failed');
    } else {
      setItems(list => list.map(item => item.id === editingId ? d.item : item));
      cancelEdit();
    }
    setSavingEdit(false);
  }

  async function deleteItem(id: number) {
    if (!confirm('Delete this menu item?')) return;
    setDeletingId(id);
    const r = await fetch(`/api/admin/menu-items/${id}`, { method:'DELETE' });
    if (r.status === 401) { router.replace('/thepynkspice-chef/login'); return; }
    const d = await r.json();
    if (!d.ok) {
      alert(d.error || 'Delete failed');
    } else {
      setItems(list => list.filter(i => i.id !== id));
    }
    setDeletingId(null);
  }

  async function toggleActive(id: number, current: boolean) {
    setTogglingId(id);
    const r = await fetch(`/api/admin/menu-items/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: !current }) });
    if (r.status === 401) { router.replace('/thepynkspice-chef/login'); return; }
    const d = await r.json();
    if (!d.ok) {
      alert(d.error || 'Update failed');
    } else {
      setItems(list => list.map(i => i.id === id ? d.item : i));
    }
    setTogglingId(null);
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
            {items.map(it => {
              const editing = editingId === it.id && editForm;
              return (
                <li key={it.id} className="py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        <span>{it.name_en}</span>
                        <span className="text-gray-400">/ {it.name_de}</span>
                        {!it.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200">Inactive</span>}
                      </div>
                      <div className="text-xs text-gray-500">Spicy {it.spicy_level} • €{(it.price_cents/100).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button onClick={()=> startEdit(it)} className="px-3 py-1 rounded bg-white border shadow-sm hover:bg-gray-50">Edit</button>
                      <button disabled={togglingId===it.id} onClick={()=> toggleActive(it.id, it.active)} className={`px-3 py-1 rounded shadow-sm disabled:opacity-50 ${it.active ? 'bg-yellow-500 text-white' : 'bg-emerald-600 text-white'}`}>{togglingId===it.id ? 'Saving…' : (it.active ? 'Deactivate' : 'Activate')}</button>
                      <button disabled={deletingId===it.id} onClick={()=> deleteItem(it.id)} className="px-3 py-1 rounded bg-red-600 text-white shadow-sm disabled:opacity-50">{deletingId===it.id?'Deleting…':'Delete'}</button>
                      <span className="text-gray-400">#{it.id}</span>
                    </div>
                  </div>
                  {editing && editForm && (
                    <form onSubmit={saveEdit} className="mt-4 grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-xs font-medium mb-1">Name (EN)</label>
                        <input value={editForm.name_en} onChange={e=> setEditForm(f=> f && ({...f, name_en:e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Name (DE)</label>
                        <input value={editForm.name_de} onChange={e=> setEditForm(f=> f && ({...f, name_de:e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Description (EN)</label>
                        <textarea value={editForm.description_en} onChange={e=> setEditForm(f=> f && ({...f, description_en:e.target.value}))} className="w-full p-2 border rounded min-h-20" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Description (DE)</label>
                        <textarea value={editForm.description_de} onChange={e=> setEditForm(f=> f && ({...f, description_de:e.target.value}))} className="w-full p-2 border rounded min-h-20" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Ingredients (EN)</label>
                        <input value={editForm.ingredients_en} onChange={e=> setEditForm(f=> f && ({...f, ingredients_en:e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Ingredients (DE)</label>
                        <input value={editForm.ingredients_de} onChange={e=> setEditForm(f=> f && ({...f, ingredients_de:e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Spicy</label>
                        <SpicyLevelPicker value={editForm.spicy_level} onChange={v=> setEditForm(f=> f && ({...f, spicy_level:v}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Price (EUR)</label>
                        <input type="number" step="0.01" value={editForm.price_euros} onChange={e=> setEditForm(f=> f && ({...f, price_euros:e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">Images (comma)</label>
                        <input value={editForm.images} onChange={e=> setEditForm(f=> f && ({...f, images:e.target.value}))} className="w-full p-2 border rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input id={`active-${it.id}`} type="checkbox" checked={editForm.active} onChange={e=> setEditForm(f=> f && ({...f, active:e.target.checked}))} />
                        <label htmlFor={`active-${it.id}`} className="text-xs font-medium">Active</label>
                      </div>
                      <div className="md:col-span-2 flex gap-3">
                        <button type="submit" disabled={savingEdit} className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50">{savingEdit?'Saving…':'Save'}</button>
                        <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded bg-gray-200 text-sm">Cancel</button>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
            {!items.length && <li className="py-3 text-sm text-gray-500">No items yet.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}