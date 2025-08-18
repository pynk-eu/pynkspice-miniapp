'use client';

import type { MenuItem } from '@/types/index';
import AddToCartButton from '@/components/AddToCartButton';
import { useLang } from '@/contexts/LangContext';
import ImageSlider from './ImageSlider';

interface Props {
  item: MenuItem;
}

const MenuItemDetail = ({ item }: Props) => {
  const { lang } = useLang();
  return (
    <div className="container mx-auto p-4">
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
