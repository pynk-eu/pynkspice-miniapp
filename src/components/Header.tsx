'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LangContext';

const Header = () => {
  const { cart } = useCart();
  const { lang, setLang } = useLang();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="w-full bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/menu" className="flex items-center space-x-2">
        <Image src="/thePynkSpice_logo.jpg" alt="The PynkSpice Logo" width={50} height={50} className="rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-bold text-pink-500">The PynkSpice</h1>
          <p className="text-gray-500 text-sm">Authentic Indian Vegetarian Cuisine</p>
        </div>
      </Link>
      <nav className="flex items-center gap-3">
        <div className="flex items-center gap-1 border rounded-full px-2 py-1 text-sm">
          <button
            aria-pressed={lang === 'de'}
            onClick={() => setLang('de')}
            className={`px-2 py-0.5 rounded-full ${lang === 'de' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
          >DE</button>
          <button
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 rounded-full ${lang === 'en' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}
          >EN</button>
        </div>
        <Link href="/cart" className="relative">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
        <Link
          href="/cart"
          aria-disabled={itemCount === 0}
          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
            itemCount > 0
              ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[.98]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Checkout
        </Link>
      </nav>
    </header>
  );
};

export default Header;
