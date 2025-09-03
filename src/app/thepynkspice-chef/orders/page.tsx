"use client";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';

interface AdminOrderItem { id:number; name:string; quantity:number; unit_price:number; line_total:number }
interface AdminOrder { id:number; code:string; created_at:string; status:string; total:number; delivery_method:string; notes?:string|null; customer?:{ name?:string|null; phone?:string|null; email?:string|null }; items:AdminOrderItem[] }

const STATUS_OPTIONS = ['new','preparing','ready','fulfilled','cancelled'];

export default function OrdersPage(){
	const router = useRouter();
	const [orders,setOrders] = useState<AdminOrder[]>([]);
	const [loading,setLoading] = useState(true);
	const [error,setError] = useState<string|undefined>();
	const [updating,setUpdating] = useState<string|null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(undefined);
		const r = await fetch('/api/admin/orders',{cache:'no-store'});
		if(r.status===401){ router.replace('/thepynkspice-chef/login'); return; }
		const d = await r.json();
		if(!d.ok) setError(d.error||'Failed to load'); else setOrders(d.orders);
		setLoading(false);
	},[router]);
	useEffect(()=>{ load(); },[load]);

	async function updateStatus(code:string, status:string){
		setUpdating(code+status);
		const r = await fetch('/api/admin/orders',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({ code, status })});
		if(r.status===401){ router.replace('/thepynkspice-chef/login'); return; }
		const d = await r.json();
		if(!d.ok){ alert(d.error||'Update failed'); }
		await load();
		setUpdating(null);
	}

	// Map status to subtle background + border colors
	const statusStyles: Record<string,string> = useMemo(()=>({
		new: 'bg-white border-gray-200',
		preparing: 'bg-amber-50 border-amber-200',
		ready: 'bg-indigo-50 border-indigo-200',
		fulfilled: 'bg-emerald-50 border-emerald-200',
		cancelled: 'bg-red-50 border-red-200',
	}),[]);

	return (
		<div className="max-w-7xl mx-auto p-8 space-y-8">
			<AdminNav />
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold">Orders</h1>
					<p className="text-gray-600 text-sm">Recent (latest 100) customer & offline orders.</p>
				</div>
				<div className="flex gap-3">
					<button onClick={load} className="px-4 py-2 rounded-lg bg-white border text-sm shadow-sm hover:bg-gray-50">Refresh</button>
					<Link href="/menu?offlineOrder=1" className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium shadow-sm hover:bg-pink-500">New Offline Order</Link>
				</div>
			</div>
			{error && <div className="p-3 rounded bg-red-50 text-sm text-red-600">{error}</div>}
			{loading ? (
				<p className="text-sm text-gray-500">Loading orders…</p>
			) : !orders.length ? (
				<p className="text-sm text-gray-500">No orders yet.</p>
			) : (
				<div className="space-y-6">
					{orders.map(o => {
						const cls = statusStyles[o.status] || 'bg-white border-gray-200';
						return (
						<div key={o.id} className={`border rounded-xl shadow-sm p-5 transition ${cls}`}>
							<div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
								<div className="space-y-1">
									<div className="flex items-center gap-3 flex-wrap">
										<span className="font-semibold text-lg">#{o.code}</span>
										<span className="text-xs px-2 py-0.5 rounded bg-gray-100">{new Date(o.created_at).toLocaleString()}</span>
										<span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{o.delivery_method}</span>
									</div>
									<div className="text-sm text-gray-600">Total: €{o.total.toFixed(2)}</div>
									{o.customer?.name && <div className="text-xs text-gray-500">Customer: {o.customer.name}{o.customer.phone?` • ${o.customer.phone}`:''}{o.customer.email?` • ${o.customer.email}`:''}</div>}
									{o.notes && <div className="text-xs text-gray-500">Notes: {o.notes}</div>}
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<label className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</label>
									<select disabled={!!updating} value={o.status} onChange={e=>updateStatus(o.code, e.target.value)} className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-pink-600">
										{STATUS_OPTIONS.map(s=> <option key={s} value={s}>{s}</option>)}
									</select>
								</div>
							</div>
							<div className="mt-4 overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
											<th className="py-1 pr-3">Item</th>
											<th className="py-1 pr-3">Qty</th>
											<th className="py-1 pr-3">Unit €</th>
											<th className="py-1 pr-3">Line €</th>
										</tr>
									</thead>
									<tbody>
										{o.items.map(it => (
											<tr key={it.id} className="border-b last:border-0">
												<td className="py-1 pr-3 font-medium text-gray-800">{it.name}</td>
												<td className="py-1 pr-3">{it.quantity}</td>
												<td className="py-1 pr-3">{it.unit_price.toFixed(2)}</td>
												<td className="py-1 pr-3">{it.line_total.toFixed(2)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)})}
				</div>
			)}
		</div>
	);
}