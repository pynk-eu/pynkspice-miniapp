'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LangContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMessages } from '@/hooks/useMessages';

const Header = () => {
  const { cart } = useCart();
  const { lang, setLang } = useLang();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMenuActive = pathname === '/' || pathname.startsWith('/menu');
  const isCartActive = pathname.startsWith('/cart');
  const { t } = useMessages();

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="w-full bg-white shadow-md px-4 py-3 flex justify-between items-center sticky top-0 z-50">
      {isMenuActive ? (
        <div className="flex items-center gap-2 min-w-0 cursor-default" aria-current="page">
          <Image src="/thePynkSpice_logo.jpg" alt="The PynkSpice Logo" width={50} height={50} className="rounded-full object-cover" />
          <div className="truncate">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-500 truncate">The PynkSpice</h1>
            <p className="text-gray-500 text-xs sm:text-sm truncate">Authentic Vegetarian Cuisine</p>
          </div>
        </div>
      ) : (
        <Link href="/menu" className="flex items-center gap-2 min-w-0">
          <Image src="/thePynkSpice_logo.jpg" alt="The PynkSpice Logo" width={50} height={50} className="rounded-full object-cover" />
          <div className="truncate">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-500 truncate">The PynkSpice</h1>
            <p className="text-gray-500 text-xs sm:text-sm truncate">Authentic Vegetarian Cuisine</p>
          </div>
        </Link>
      )}
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-3">
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
          <svg
            className={`w-8 h-8 ${isCartActive ? 'text-gray-900' : 'text-gray-700'}`}
            style={isCartActive ? undefined : { color: 'var(--tg-link)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
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

      {/* Mobile actions */}
      <div className="flex md:hidden items-center gap-3">
        <Link href="/cart" className="relative" aria-label="Open cart">
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-drawer"
          onClick={() => setOpen(true)}
          className="p-2 rounded-md border text-gray-700 hover:bg-gray-50 active:scale-[.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3.75 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 6a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 6a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-drawer"
            className="fixed right-0 top-0 h-full w-72 max-w-[85vw] bg-white z-[70] shadow-xl p-4 flex flex-col"
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-900">{t('nav.menu', lang === 'de' ? 'Speisekarte' : 'Menu')}</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">{t('nav.language', lang === 'de' ? 'Sprache' : 'Language')}</div>
              <div className="flex items-center gap-2">
                <button
                  aria-pressed={lang === 'de'}
                  onClick={() => setLang('de')}
                  className={`px-3 py-1 rounded-full border ${lang === 'de' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-700'}`}
                >DE</button>
                <button
                  aria-pressed={lang === 'en'}
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-full border ${lang === 'en' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-700'}`}
                >EN</button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/menu"
                aria-current={isMenuActive ? 'page' : undefined}
                className={`px-3 py-2 rounded-md hover:bg-gray-100 ${isMenuActive ? 'bg-gray-100 text-gray-900 font-semibold' : ''}`}
                style={isMenuActive ? undefined : { color: 'var(--tg-link)' }}
                onClick={() => setOpen(false)}
              >
                {t('nav.menu', lang === 'de' ? 'Speisekarte' : 'Menu')}
              </Link>
              <Link
                href="/cart"
                aria-current={isCartActive ? 'page' : undefined}
                className={`px-3 py-2 rounded-md hover:bg-gray-100 ${isCartActive ? 'bg-gray-100 text-gray-900 font-semibold' : ''}`}
                style={isCartActive ? undefined : { color: 'var(--tg-link)' }}
                onClick={() => setOpen(false)}
              >
                {t('nav.cart', lang === 'de' ? 'Warenkorb' : 'Cart')}
              </Link>
              <Link
                href="/cart"
                aria-disabled={itemCount === 0}
                onClick={() => setOpen(false)}
                className={`mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  itemCount > 0
                    ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[.98]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('cart.checkout', lang === 'de' ? 'Zur Kasse' : 'Proceed to Checkout')}
              </Link>
            </div>

            <div className="mt-auto text-xs text-gray-500">
              <p>&copy; {new Date().getFullYear()} The PynkSpice</p>
            </div>
          </aside>
        </>
      )}
    </header>
  );
};

export default Header;
