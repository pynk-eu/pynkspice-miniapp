import { getMenuItemById } from '@/lib/data';
import MenuItemDetail from '@/components/MenuItemDetail';
import { notFound } from 'next/navigation';

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getMenuItemById(Number(id));

  if (!item) {
    notFound();
  }

  return <MenuItemDetail item={item} />;
}
