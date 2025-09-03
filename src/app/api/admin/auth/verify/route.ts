import { NextResponse } from 'next/server';
import { verifyAndConsumeCode, createAdminToken, adminAuthCookie } from '@/lib/adminAuth';
export async function POST(req: Request) {
  try { const body = await req.json().catch(()=>({})); const code = (body.code||'').toString().trim().toUpperCase(); if (!code || code.length!==6) return NextResponse.json({ ok:false, error:'Invalid code' },{status:400}); const ok = await verifyAndConsumeCode(code); if (!ok) return NextResponse.json({ ok:false, error:'Code invalid or expired' },{status:401}); const token = createAdminToken(); const res = NextResponse.json({ ok:true }); res.headers.append('Set-Cookie', adminAuthCookie(token)); return res; } catch { return NextResponse.json({ ok:false, error:'Error verifying code' }, { status:500 }); }
}
