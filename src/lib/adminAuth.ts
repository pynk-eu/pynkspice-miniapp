import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sql } from './db';

const TOKEN_EXP_SECONDS = 60 * 60 * 8; // 8h

function getSecret() {
  const sec = process.env.ADMIN_API_KEY || process.env.ADMIN_JWT_SECRET;
  if (!sec) throw new Error('ADMIN_API_KEY or ADMIN_JWT_SECRET required');
  return sec;
}

export function generateOneTimeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
export function hashCode(code: string) { return crypto.createHash('sha256').update(code).digest('hex'); }
export async function storeLoginCode(code: string) {
  const hash = hashCode(code);
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await sql`INSERT INTO admin_login_codes (code_hash, expires_at) VALUES (${hash}, ${expires})`;
}
interface AdminLoginCodeRow { id: number }
export async function verifyAndConsumeCode(code: string) {
  const hash = hashCode(code);
  const rows = await sql`SELECT id FROM admin_login_codes WHERE code_hash = ${hash} AND used_at IS NULL AND expires_at > now() ORDER BY id DESC LIMIT 1` as unknown as AdminLoginCodeRow[];
  if (!rows.length) return false;
  await sql`UPDATE admin_login_codes SET used_at = now() WHERE id = ${rows[0].id}`;
  return true;
}
export function createAdminToken() { return jwt.sign({ role: 'admin' }, getSecret(), { expiresIn: TOKEN_EXP_SECONDS }); }
interface AdminJwtPayload extends JwtPayload { role?: string }
export function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, getSecret()) as AdminJwtPayload;
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}
export function adminAuthCookie(token: string) { return `admin_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_EXP_SECONDS}`; }
export function extractAdminTokenFromHeaders(headers: Headers) {
  const cookie = headers.get('cookie') || ''; const m = cookie.match(/admin_auth=([^;]+)/); return m ? decodeURIComponent(m[1]) : undefined;
}
