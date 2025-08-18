'use client';

import type { MenuItem } from '@/types/index';
import AddToCartButton from '@/components/AddToCartButton';
import { useLang } from '@/contexts/LangContext';
import ImageSlider from './ImageSlider';
import Link from 'next/link';

interface Props {
  item: MenuItem;
}

const MenuItemDetail = ({ item }: Props) => {
  const { lang } = useLang();
  return (
    <div className="container mx-auto p-4">
      <div className="mb-3">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M20.25 12a.75.75 0 01-.75.75H6.31l4.22 4.22a.75.75 0 11-1.06 1.06l-5.5-5.5a.75.75 0 010-1.06l5.5-5.5a.75.75 0 111.06 1.06L6.31 11.25H19.5a.75.75 0 01.75.75z" clipRule="evenodd" /></svg>
          <span>{lang === 'de' ? 'Zur Speisekarte' : 'Back to menu'}</span>
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden md:grid md:grid-cols-2">
        <div className="relative h-72 md:h-full">
          <ImageSlider images={item.images} alt={item.name[lang]} />
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{item.name[lang]}</h1>
            <p className="mt-2 text-xl font-semibold text-pink-600">€{item.price.toFixed(2)}</p>
          </div>

          <p className="text-gray-700 leading-relaxed">{item.description[lang]}</p>

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{lang === 'de' ? 'Zutaten' : 'Ingredients'}</h2>
              <p className="text-gray-600">{item.ingredients[lang].join(', ')}</p>
            </div>
          </div>

          <div className="pt-4">
            <AddToCartButton item={item} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;
