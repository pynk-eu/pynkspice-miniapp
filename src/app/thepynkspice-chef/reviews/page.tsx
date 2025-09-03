import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminSession';
import AdminNav from '@/components/AdminNav';

export default async function ReviewsPage(){
	if(!(await isAdminRequest())) redirect('/thepynkspice-chef/login');
	return (
		<div className="max-w-5xl mx-auto p-8 space-y-6">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold">Reviews</h1>
					<p className="text-gray-600">(Placeholder) Show customer ratings & comments here.</p>
				</div>
				<AdminNav />
			</div>
			<div className="p-4 rounded-lg border bg-white text-sm text-gray-600">Review management UI coming soon.</div>
		</div>
	);
}