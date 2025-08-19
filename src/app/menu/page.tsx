import { getMenuItems } from '@/lib/data';
import MenuItemCard from '@/components/MenuItemCard';
import TelegramGreeting from '@/components/TelegramGreeting';
import TelegramOrdersLink from '@/components/TelegramOrdersLink';

export default async function MenuPage() {
  const menuItems = await getMenuItems();

  return (
    <div className="container mx-auto p-4">
      <TelegramGreeting />
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-bold text-gray-800">Speisekarte</h1>
        <TelegramOrdersLink />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
