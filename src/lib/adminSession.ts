import { cookies } from 'next/headers';
import { verifyAdminToken } from './adminAuth';

export function isAdminRequest(): boolean {
	// In Next 15 cookies() returns a read-only wrapper (not a Promise here); adjust if API changes.
	const c = cookies();
	// @ts-ignore types may differ based on Next version
	const token = typeof c.get === 'function' ? c.get('admin_auth')?.value : undefined;
	return verifyAdminToken(token);
}