import { NextResponse } from 'next/server';
import { generateOneTimeCode, storeLoginCode } from '@/lib/adminAuth';
import { sendAdminMessage } from '@/lib/telegramBot';
export async function POST() {
  try { const code = generateOneTimeCode(); await storeLoginCode(code); await sendAdminMessage(`Chef login code: ${code} (valid 5 min)`); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ ok: false, error: 'Failed to generate code' }, { status: 500 }); }
}
