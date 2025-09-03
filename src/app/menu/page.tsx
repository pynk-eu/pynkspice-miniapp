import { getMenuItems } from '@/lib/data';
import MenuItemCard from '@/components/MenuItemCard';
import TelegramGreeting from '@/components/TelegramGreeting';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { isAdminRequest } from '@/lib/adminSession';

export default async function MenuPage({ searchParams }: { searchParams?: Record<string,string|undefined> }) {
  const menuItems = await getMenuItems();
  const offline = searchParams?.offlineOrder === '1';
  const isAdmin = isAdminRequest();

  return (
    <div className="container mx-auto p-4">
  <TelegramGreeting />
  {isAdmin && (
    <div className="mb-4 flex items-center gap-3 text-xs">
      <Link href="/thepynkspice-chef" className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-600 text-white shadow hover:bg-pink-500">Admin Dashboard</Link>
      <span className="text-gray-400">|</span>
      <Link href="/thepynkspice-chef/orders" className="text-pink-600 hover:underline">Orders</Link>
      <Link href="/thepynkspice-chef/menu" className="text-pink-600 hover:underline">Menu</Link>
      <Link href="/thepynkspice-chef/reviews" className="text-pink-600 hover:underline">Reviews</Link>
    </div>
  )}
  {offline && (
    <div className="mb-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-sm flex items-center justify-between gap-3">
      <div>
        <strong>Offline Order Mode:</strong> Items added will be placed on behalf of a customer.
      </div>
      <Link href="/menu" className="text-amber-700 underline">Exit</Link>
    </div>
  )}
  <h1 className="text-3xl font-bold text-gray-800 mb-3">Speisekarte</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
