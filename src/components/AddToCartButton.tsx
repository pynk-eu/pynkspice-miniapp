'use client';

import { useCart } from '@/contexts/CartContext';
import type { MenuItem } from '@/types/index';
import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LangContext';

interface AddToCartButtonProps {
  item: MenuItem;
}

const iconBtn =
  'inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition';

const AddToCartButton = ({ item }: AddToCartButtonProps) => {
  const { cart, addToCart, removeFromCart } = useCart();
  const { lang } = useLang();
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const cartItem = cart.find((cartItem) => cartItem.id === item.id);
    setQuantity(cartItem ? cartItem.quantity : 0);
  }, [cart, item.id]);

  const canInc = () => {
    const maxQ = item.maxQuantity;
    if (maxQ == null || maxQ === -1) return true;
    return quantity < maxQ;
  };
  const inc = () => {
    if (canInc()) addToCart(item, 1);
  };
  const dec = () => {
    if (quantity > 1) addToCart(item, -1);
    else removeFromCart(item.id);
  };

  if (quantity === 0) {
    return (
      <button
        onClick={inc}
        disabled={!canInc()}
        className="w-full inline-flex items-center justify-center gap-2 bg-pink-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-full shadow-sm hover:bg-pink-700 active:scale-[.98] transition"
        aria-label={`Add ${(typeof item.name === 'string' ? item.name : item.name[lang])} to cart`}
      >
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/></svg>
  {lang === 'de' ? 'In den Warenkorb' : 'Add to cart'}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
  <button onClick={dec} className={iconBtn} aria-label={`Decrease ${(typeof item.name === 'string' ? item.name : item.name[lang])} quantity`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/></svg>
        </button>
        <span className="min-w-6 text-center font-medium">{quantity}</span>
  <button onClick={inc} disabled={!canInc()} className={`${iconBtn} disabled:opacity-50`} aria-label={`Increase ${typeof item.name === 'string' ? item.name : item.name.de} quantity`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/></svg>
        </button>
      </div>
  <button onClick={() => removeFromCart(item.id)} className={iconBtn} aria-label={`Remove ${(typeof item.name === 'string' ? item.name : item.name[lang])} from cart`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"/></svg>
      </button>
    </div>
  );
};

export default AddToCartButton;
