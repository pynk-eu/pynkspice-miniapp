import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminSession';
import AdminNav from '@/components/AdminNav';

export default function AdminDashboard() {
  if (!isAdminRequest()) redirect('/thepynkspice-chef/login');
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Chef Dashboard</h1>
        <p className="text-gray-600">Manage your restaurant data.</p>
      </header>
      <AdminNav />
      <nav className="grid gap-6 sm:grid-cols-2">
        <Link href="/thepynkspice-chef/menu" className="group block rounded-xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow transition">
          <h2 className="font-semibold text-lg mb-1 group-hover:text-pink-600">Menu Items</h2>
          <p className="text-sm text-gray-600">Add, edit, and deactivate dishes.</p>
        </Link>
        <Link href="/thepynkspice-chef/orders" className="group block rounded-xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow transition">
          <h2 className="font-semibold text-lg mb-1 group-hover:text-pink-600">Orders</h2>
          <p className="text-sm text-gray-600">View recent customer orders.</p>
        </Link>
        <Link href="/thepynkspice-chef/reviews" className="group block rounded-xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow transition">
          <h2 className="font-semibold text-lg mb-1 group-hover:text-pink-600">Reviews</h2>
          <p className="text-sm text-gray-600">See feedback & ratings.</p>
        </Link>
        <Link href="/menu" className="group block rounded-xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow transition">
          <h2 className="font-semibold text-lg mb-1 group-hover:text-pink-600">Public Menu</h2>
          <p className="text-sm text-gray-600">Open customer-facing menu.</p>
        </Link>
      </nav>
    </div>
  );
}
