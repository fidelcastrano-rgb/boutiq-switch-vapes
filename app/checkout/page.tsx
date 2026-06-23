'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartStore } from '@/lib/cart';
import { 
  AlertCircle, 
  Lock, 
  ShoppingBag, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  variant?: string;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      return [...cartStore.getItems()];
    }
    return [];
  });
  const [mounted, setMounted] = useState(false);
  
  // Customer checkout state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // UI state managers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load the cart store items
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    const unsubscribe = cartStore.subscribe(() => {
      setCartItems([...cartStore.getItems()]);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Calculate items total
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Form handle submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (cartItems.length === 0) {
      setError('Your shopping cart is currently empty.');
      return;
    }

    if (!name.trim() || !email.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      setError('Please fill in all required shipping fields.');
      return;
    }

    setIsSubmitting(true);

    // Merge individual address lines into a single address string for backend
    const fullAddress = `${streetAddress}, ${city}, ${state} ${zipCode}`;

    // Map cart items into strict required payload format
    const payload = {
      items: cartItems.map(item => ({
        id: item.id,
        name: item.variant ? `${item.name} (${item.variant})` : item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      })),
      total: Number(subtotal),
      customer: {
        name: name.trim(),
        email: email.trim(),
        address: fullAddress.trim()
      }
    };

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success === true) {
        // Complete checkout: Clear local cart
        cartStore.clearCart();
        try {
          localStorage.removeItem('boutiq_cart');
        } catch (e) {
          // Ignored
        }
        // Redirect to success page
        router.push(`/success?orderId=${data.orderId}`);
      } else {
        setError(data.error || 'Failed to register your secure order. Please check inputs.');
      }
    } catch (err: any) {
      console.error('Fetch Checkout Error:', err);
      setError('Network communication error placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip rendering until mounted to prevent SSR hydration gaps
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#d4af37] w-10 h-10" />
          <p className="text-gray-400 font-medium font-sans">Securing checkout session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 font-sans" id="checkout-viewport">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation / Header */}
        <div className="mb-8 select-none">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight mb-10 text-white">
          Secure Checkout
        </h1>

        <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-start">
          
          {/* Checkout Data Form */}
          <form onSubmit={handlePlaceOrder} className="space-y-8" id="checkout-form">
            
            {error && (
              <div className="bg-red-950/40 border border-red-800 text-red-400 rounded-2xl p-4 text-sm font-medium flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Shipping section */}
            <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2.5 text-white">
                <CheckCircle2 className="text-[#d4af37] w-5 h-5" /> Shipping Information
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Email Address (For Invoices & Tracking) *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Main St, Apt 4B"
                    value={streetAddress}
                    onChange={e => setStreetAddress(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Los Angeles"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">State / Province *</label>
                    <input
                      type="text"
                      required
                      placeholder="CA"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">ZIP / PC *</label>
                    <input
                      type="text"
                      required
                      placeholder="90001"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>
          </form>

          {/* Cart sidebar / Aggregate calculation */}
          <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 space-y-6" id="cart-sidebar">
            <div className="border-b border-[#1f1f23] pb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#d4af37]" /> Order Summary
              </h2>
              <span className="text-xs text-gray-400 font-semibold">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-6 text-gray-400 space-y-2">
                <ShoppingBag size={32} className="mx-auto text-gray-600 animate-pulse" />
                <p className="text-sm">Your cart is empty.</p>
                <Link href="/products" className="text-[#d4af37] hover:underline text-xs font-bold block">View Collection</Link>
              </div>
            ) : (
              <>
                {/* List Items */}
                <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.variant || ''}`} className="flex justify-between items-start text-xs gap-3">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-200 line-clamp-2">{item.name}</p>
                        <div className="flex items-center gap-2 text-gray-400">
                          {item.variant && <span className="text-[10px] bg-[#1a1a1e] px-2 py-0.5 rounded text-gray-300 font-medium capitalize">{item.variant}</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span className="font-mono font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => cartStore.removeItem(item.id, item.variant || '')}
                          className="text-gray-500 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1f1f23] pt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-white font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="font-mono text-emerald-400 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between items-center text-white border-t border-[#1f1f23] pt-3">
                    <span className="font-bold">Total</span>
                    <strong className="font-mono text-xl text-[#d4af37]">${subtotal.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Place Order CTA Button */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full bg-[#d4af37] hover:bg-[#c5a030] text-black py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/10"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" /> Securing Order...
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Place Order Securely
                    </>
                  )}
                </button>
                
                <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <Lock size={10} /> 256-bit Secure Sockets Layer Encryption
                </p>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
