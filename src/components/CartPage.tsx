'use client';

import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import AddToCartButton from '@/components/AddToCartButton';
import type { CartItem } from '@/types/index';
import { useLang } from '@/contexts/LangContext';
import { useMessages } from '@/hooks/useMessages';
import { useTelegram } from '@/hooks/useTelegram';
import { useUser } from '@/contexts/UserContext';

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
  const { tg } = useTelegram();
  const router = useRouter();
  // Delivery hidden for now; keep state fixed at 'pickup'
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [notes, setNotes] = useState('');
  // Delivery fields disabled
  // Removed dormant pincode/city state (delivery currently disabled)
  const { user } = useUser();
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
  // Delivery address validation omitted (delivery disabled)
  const addressOk = true; // delivery disabled
  const canProceed = canCheckout && nameOk && phoneOk && emailOk && addressOk;

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCheckout = useCallback(async () => {
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
          address: undefined, // delivery disabled currently
        },
        telegramUserId: tg?.initDataUnsafe?.user?.id,
        telegramUsername: tg?.initDataUnsafe?.user?.username,
        telegramFirstName: tg?.initDataUnsafe?.user?.first_name,
        telegramLastName: tg?.initDataUnsafe?.user?.last_name,
        customer: {
          name: name || undefined,
          phone: phone || undefined,
          email: email || undefined,
          language: lang,
        },
        notes,
        total,
      } as const;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to place order');
  setMessage('Order placed! We\'ll contact you shortly.');
  // Clear cart and reset form state
  clearCart();
  setFulfillment('pickup');
  setNotes('');
  // (delivery fields cleared – currently disabled)
  setName('');
  setPhone('');
  setEmail('');
      const orderId = (data && (data.orderId || data.id)) || '';
      // Save a brief order summary for the success page (even in Telegram; keeps UX consistent)
      try {
        const summary = {
          orderId,
          total,
          deliveryMethod: fulfillment,
          items: cart.map(({ id, name, price, quantity }) => ({
            id,
            name: typeof name === 'string' ? name : name[lang],
            price,
            quantity,
          })),
        };
        sessionStorage.setItem('lastOrderSummary', JSON.stringify(summary));
      } catch {}
      if (tg) {
        try {
          tg.HapticFeedback?.notificationOccurred('success');
          tg.sendData?.(JSON.stringify({ type: 'order', ok: true, orderId, total }));
        } catch {}
      }
      const query = new URLSearchParams({ orderId, total: String(total) }).toString();
      router.push(`/cart/success?${query}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }, [canProceed, fulfillment, lang, cart, name, phone, email, notes, total, tg, router, clearCart]);

  // Prefill user profile fields (name, phone, email) if inside Telegram and we have saved profile
  // Prefill from UserContext (single fetch session-wide)
  useEffect(() => {
    if (user) {
      if (user.customerName && !name) setName(String(user.customerName));
      if (user.phone && !phone) setPhone(String(user.phone));
      if (user.email && !email) setEmail(String(user.email));
    }
  }, [user, name, phone, email]);

  // Telegram MainButton: keep hidden so we use our own button even inside Telegram
  useEffect(() => {
    if (!tg) return;
    try {
      tg.ready();
      if (tg.expand) tg.expand();
      tg.MainButton.hide();
    } catch {}
  }, [tg]);

  return (
    <div className="container mx-auto p-4 space-y-6 overflow-x-hidden">
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
                  <li key={item.id} className="py-4 flex flex-wrap items-center gap-4">
                    <div className="relative w-20 h-16 shrink-0 overflow-hidden rounded-md ring-1 ring-gray-100">
          <SafeImage src={item.images[0]} alt={item.name[lang]} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name[lang]}</p>
          <p className="text-sm text-gray-600">€{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
                      <div className="w-full sm:w-44"><AddToCartButton item={item} /></div>
                      <div className="text-right font-semibold text-gray-900 min-w-[4.5rem]">
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>
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
                  className="w-full text-black p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
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
                  className={`w-full text-black p-2.5 border rounded-lg focus:outline-none focus:ring-2 ${phone && !phoneOk ? 'border-red-500 focus:ring-red-600' : 'focus:ring-pink-600'}`}
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
                  className={`w-full text-black p-2.5 border rounded-lg focus:outline-none focus:ring-2 ${email && !emailOk ? 'border-red-500 focus:ring-red-600' : 'focus:ring-pink-600'}`}
                />
                {email && !emailOk && (
                  <p className="text-xs text-red-600 mt-1">{lang === 'de' ? 'Bitte eine gültige E-Mail-Adresse eingeben.' : 'Please enter a valid email address.'}</p>
                )}
              </div>
            </div>
          </Section>

          <Section title={t('cart.preferences', lang === 'de' ? 'Präferenzen' : 'Preferences')} disabled={formDisabled}>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">{t('cart.pickupOnly', lang === 'de' ? 'Derzeit nur Abholung verfügbar.' : 'Pickup only at the moment.')}</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('cart.notes', lang === 'de' ? 'Notizen hinzufügen (Schärfegrad, ohne Zwiebel/Knoblauch, etc.)' : 'Add notes (spice level, no onion/garlic, etc.)')}
                disabled={formDisabled}
                className="w-full text-black min-h-28 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
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
                disabled={!canProceed || !emailOk || submitting}
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
