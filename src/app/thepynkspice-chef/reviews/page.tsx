import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminSession';
export default function ReviewsPage(){ if(!isAdminRequest()) redirect('/thepynkspice-chef/login'); return <div className="max-w-5xl mx-auto p-8 space-y-6"><h1 className="text-3xl font-bold">Reviews</h1><p className="text-gray-600">(Placeholder) Show customer ratings & comments here.</p></div>; }