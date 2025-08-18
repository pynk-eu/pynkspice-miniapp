"use client";

import type { MenuItem } from '@/types/index';
import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import ImageSlider from './ImageSlider';
import { useLang } from '@/contexts/LangContext';

const MenuItemCard = ({ item }: { item: MenuItem }) => {
  const { lang } = useLang();
  return (
    <div className="group bg-white rounded-2xl shadow-md ring-1 ring-gray-100 overflow-hidden hover:shadow-lg transition flex flex-col">
      <div className="relative block aspect-[4/3]">
        <ImageSlider images={item.images} alt={item.name[lang]} />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{item.name[lang]}</h3>
          <span className="text-pink-600 font-semibold shrink-0">€{item.price.toFixed(2)}</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2">{item.description[lang]}</p>
        <div className="mt-auto pt-2 flex items-center justify-between gap-3">
          <AddToCartButton item={item} />
          <Link
            href={`/menu/${item.id}`}
            className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
