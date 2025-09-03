import { NextResponse } from 'next/server';
import { extractAdminTokenFromHeaders, verifyAdminToken } from '@/lib/adminAuth';
import { updateMenuItem, deleteMenuItem } from '@/lib/menu';

function getIdFromUrl(url: string): number | null {
	try {
		const u = new URL(url);
		const parts = u.pathname.split('/').filter(Boolean);
		const idStr = parts[parts.length - 1];
		const n = Number(idStr);
		return Number.isFinite(n) ? n : null;
	} catch { return null; }
}

export async function PATCH(req: Request) {
	const token = extractAdminTokenFromHeaders(req.headers);
	if (!verifyAdminToken(token)) return NextResponse.json({ ok:false, error:'Unauthorized' },{status:401});
	const id = getIdFromUrl(req.url);
	if (id == null) return NextResponse.json({ ok:false, error:'Invalid id' },{status:400});
	const body = await req.json();
	const updated = await updateMenuItem({ id, ...body });
	if (!updated) return NextResponse.json({ ok:false, error:'Not found' },{status:404});
	return NextResponse.json({ ok:true, item: updated });
}

export async function DELETE(req: Request) {
	const token = extractAdminTokenFromHeaders(req.headers);
	if (!verifyAdminToken(token)) return NextResponse.json({ ok:false, error:'Unauthorized' },{status:401});
	const id = getIdFromUrl(req.url);
	if (id == null) return NextResponse.json({ ok:false, error:'Invalid id' },{status:400});
	const ok = await deleteMenuItem(id);
	if (!ok) return NextResponse.json({ ok:false, error:'Not found' },{status:404});
	return NextResponse.json({ ok:true });
}
