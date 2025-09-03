import { cookies } from 'next/headers';
import { verifyAdminToken } from './adminAuth';

interface ReadonlyRequestCookiesLike {
	get(name: string): { name: string; value: string } | undefined;
}

export function isAdminRequest(): boolean {
	try {
		const c = cookies() as unknown as ReadonlyRequestCookiesLike;
		const token = c.get('admin_auth')?.value;
		return verifyAdminToken(token);
	} catch {
		return false;
	}
}