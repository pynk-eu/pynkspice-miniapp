'use client';

import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useCart } from '@/contexts/CartContext';
import AddToCartButton from '@/components/AddToCartButton';
import type { CartItem } from '@/types/index';
import { useLang } from '@/contexts/LangContext';
import { useMessages } from '@/hooks/useMessages';

const Section = ({ title, children, disabled = false }: { title: string; children: React.ReactNode; disabled?: boolean }) => (
  <section
    className={`bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 md:p-6 ${disabled ? 'opacity-60' : ''}`}
  >
    <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
    <div className={disabled ? 'pointer-events-none select-none' : undefined}>{children}</div>
  </section>
);

export default function CartPage() {
  const { cart, clearCart } = useCart();
  const { lang } = useLang();
  const { t } = useMessages();
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [notes, setNotes] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [pincode, setPincode] = useState('10115');
  const [city, setCity] = useState('Berlin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const canCheckout = cart.length > 0;
  const formDisabled = !canCheckout;
  const nameOk = name.trim().length > 0;
  const isValidPhone = (v: string) => {
    const digits = v.replace(/\D/g, '');
    // Accept E.164 or local with at least 7 digits
    return /^\+?[0-9]{7,15}$/.test(v.replace(/\s|-/g, '')) || digits.length >= 7;
  };
  const phoneOk = isValidPhone(phone.trim());
  const isValidEmail = (v: string) => {
    if (!v) return true; // optional
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  };
  const emailOk = isValidEmail(email.trim());
  const isValidPincode = (v: string) => /^\d{5}$/.test(v.trim());
  const pincodeOk = isValidPincode(pincode);
  // Address fields are disabled for now; require minimal city+pincode when delivery
  const addressOk = fulfillment === 'pickup' ? true : city.trim().length > 0 && pincodeOk;
  const canProceed = canCheckout && nameOk && phoneOk && addressOk;

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!canProceed) {
      setMessage(
        fulfillment === 'delivery'
          ? (lang === 'de' ? 'Bitte Name, Telefonnummer und Lieferadresse angeben.' : 'Please provide name, phone, and delivery address.')
          : (lang === 'de' ? 'Bitte Name und Telefonnummer angeben.' : 'Please provide name and phone number.')
      );
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        items: cart.map(({ id, name, price, quantity }) => ({ id, name: typeof name === 'string' ? name : name[lang], price, quantity })),
        delivery: {
          method: fulfillment,
          address:
            fulfillment === 'delivery'
              ? {
                  street: street || undefined,
                  number: houseNumber || undefined,
                  pincode: pincode || undefined,
                  city: city || undefined,
                }
              : undefined,
        },
        customer: {
          name: name || undefined,
          phone: phone || undefined,
          email: email || undefined,
          language: lang,
        },
        notes,
        total,
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to place order');
      setMessage('Order placed! We\'ll contact you shortly.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold text-gray-900">{t('cart.title', lang === 'de' ? 'Ihre Bestellung' : 'Your Order')}</h1>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            {t('cart.clear', lang === 'de' ? 'Warenkorb leeren' : 'Clear cart')}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title={t('cart.items', lang === 'de' ? 'Artikel' : 'Items')}>
            {cart.length === 0 ? (
              <div className="text-gray-600">
                {t('cart.empty', lang === 'de' ? 'Ihr Warenkorb ist leer.' : 'Your cart is empty.')} {' '}
                <Link href="/menu" className="text-pink-600 hover:underline">{t('cart.browse', lang === 'de' ? 'Zur Speisekarte' : 'Browse the menu')}</Link>.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
        {cart.map((item: CartItem) => (
                  <li key={item.id} className="py-4 flex items-center gap-4">
                    <div className="relative w-20 h-16 shrink-0 overflow-hidden rounded-md ring-1 ring-gray-100">
          <SafeImage src={item.images[0]} alt={item.name[lang]} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name[lang]}</p>
          <p className="text-sm text-gray-600">€{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="w-44"><AddToCartButton item={item} /></div>
                    <div className="w-20 text-right font-semibold text-gray-900">
                      €{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={t('cart.contact', lang === 'de' ? 'Ihre Daten' : 'Your details')} disabled={formDisabled}>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('cart.name', lang === 'de' ? 'Name' : 'Name')}
                  disabled={formDisabled}
                  required
                  className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                />
              </div>
              <div className="flex flex-col">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('cart.phone', lang === 'de' ? 'Telefonnummer' : 'Phone number')}
                  disabled={formDisabled}
                  required
                  aria-invalid={!!phone && !phoneOk}
                  className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 ${phone && !phoneOk ? 'border-red-500 focus:ring-red-600' : 'focus:ring-pink-600'}`}
                />
                {phone && !phoneOk && (
                  <p className="text-xs text-red-600 mt-1">{lang === 'de' ? 'Bitte eine gültige Telefonnummer eingeben.' : 'Please enter a valid phone number.'}</p>
                )}
              </div>
              <div className="flex flex-col">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('cart.email', lang === 'de' ? 'E-Mail' : 'Email')}
                  disabled={formDisabled}
                  aria-invalid={!!email && !emailOk}
                  className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 ${email && !emailOk ? 'border-red-500 focus:ring-red-600' : 'focus:ring-pink-600'}`}
                />
                {email && !emailOk && (
                  <p className="text-xs text-red-600 mt-1">{lang === 'de' ? 'Bitte eine gültige E-Mail-Adresse eingeben.' : 'Please enter a valid email address.'}</p>
                )}
              </div>
            </div>
          </Section>

          <Section title={t('cart.preferences', lang === 'de' ? 'Präferenzen' : 'Preferences')} disabled={formDisabled}>
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="fulfillment"
                    value="pickup"
                    checked={fulfillment === 'pickup'}
                    onChange={() => setFulfillment('pickup')}
                    disabled={formDisabled}
                    className="text-pink-600 focus:ring-pink-600"
                  />
                  <span>{t('cart.pickup', lang === 'de' ? 'Abholung' : 'Pickup')}</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="fulfillment"
                    value="delivery"
                    checked={fulfillment === 'delivery'}
                    onChange={() => setFulfillment('delivery')}
                    disabled={formDisabled}
                    className="text-pink-600 focus:ring-pink-600"
                  />
                  <span>{t('cart.delivery', lang === 'de' ? 'Lieferung' : 'Delivery')}</span>
                </label>
              </div>

              {fulfillment === 'delivery' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder={lang === 'de' ? 'Straße' : 'Street'}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder={lang === 'de' ? 'Nr.' : 'No.'}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder={lang === 'de' ? 'PLZ' : 'Pincode'}
                      inputMode="numeric"
                      pattern="\\d*"
                      maxLength={5}
                      aria-invalid={fulfillment === 'delivery' && !!pincode && !pincodeOk}
                      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 ${fulfillment === 'delivery' && pincode && !pincodeOk ? 'border-red-500 focus:ring-red-600' : 'focus:ring-pink-600'}`}
                    />
                    {fulfillment === 'delivery' && pincode && !pincodeOk && (
                      <p className="text-xs text-red-600 mt-1">
                        {lang === 'de' ? 'Bitte eine gültige 5-stellige PLZ eingeben.' : 'Please enter a valid 5-digit postal code.'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={lang === 'de' ? 'Stadt' : 'City'}
                      disabled
                      className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
              )}

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('cart.notes', lang === 'de' ? 'Notizen hinzufügen (Schärfegrad, ohne Zwiebel/Knoblauch, etc.)' : 'Add notes (spice level, no onion/garlic, etc.)')}
                disabled={formDisabled}
                className="w-full min-h-28 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
            </div>
          </Section>
        </div>

        <div className="lg:col-span-1">
          <Section title={t('cart.summary', lang === 'de' ? 'Zusammenfassung' : 'Summary')}>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span>{t('cart.subtotal', lang === 'de' ? 'Zwischensumme' : 'Subtotal')}</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.delivery', lang === 'de' ? 'Lieferung' : 'Delivery')}</span>
                <span>{fulfillment === 'delivery' ? 'Calculated later' : '—'}</span>
              </div>
              <div className="pt-2 mt-2 border-t flex justify-between text-gray-900 font-semibold">
                <span>{t('cart.total', lang === 'de' ? 'Gesamt' : 'Total')}</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <button
                disabled={!canProceed || !emailOk}
                onClick={handleCheckout}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold py-2.5 px-4 hover:bg-green-700 active:scale-[.98] transition disabled:cursor-not-allowed"
              >
                {submitting ? t('cart.submitting', lang === 'de' ? 'Wird gesendet…' : 'Submitting…') : t('cart.checkout', lang === 'de' ? 'Zur Kasse' : 'Proceed to Checkout')}
              </button>
              {message && (
                <p className="text-sm mt-2 text-gray-700">{message}</p>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
