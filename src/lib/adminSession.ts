import { cookies } from 'next/headers';
import { verifyAdminToken } from './adminAuth';

export async function isAdminRequest(): Promise<boolean> {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('admin_auth')?.value;
		return verifyAdminToken(token);
	} catch {
		return false;
	}
}