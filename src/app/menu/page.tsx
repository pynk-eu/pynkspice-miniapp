import { getMenuItems } from '@/lib/data';
import MenuItemCard from '@/components/MenuItemCard';
import TelegramGreeting from '@/components/TelegramGreeting';

export default async function MenuPage() {
  const menuItems = await getMenuItems();

  return (
    <div className="container mx-auto p-4">
  <TelegramGreeting />
  <h1 className="text-3xl font-bold text-gray-800 mb-3">Speisekarte</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
