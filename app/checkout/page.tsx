'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartStore } from '@/lib/cart';
import { isMastercard, getCardType } from '@/lib/validation';
import { 
  AlertCircle, 
  Lock, 
  ShoppingBag, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  CreditCard,
  Check,
  Ban,
  HelpCircle,
  ShieldCheck
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
  
  // Lazy state initializers to avoid cascading renders inside useEffect
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      return [...cartStore.getItems()];
    }
    return [];
  });
  
  const [mounted, setMounted] = useState(false);
  const [isGatewayEnabled, setIsGatewayEnabled] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Shipping details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Credit Card details state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // UI interaction state managers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state: calculate detected credit card type directly on render
  const detectedCard = cardNumber.length > 1 ? getCardType(cardNumber) : 'Unknown';

  // Initialize and load the cart store items + fetch active payment settings
  useEffect(() => {
    // Check if Mastercard payments are active
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsGatewayEnabled(data.mastercard_payments_enabled !== false);
        }
      })
      .catch(err => {
        console.error('Error fetching admin settings for checkout:', err);
      })
      .finally(() => {
        setIsLoadingSettings(false);
      });

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

  // Custom credit card field spacing formatter
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) {
      value = value.slice(0, 16);
    }
    // Add space groups every 4 digits
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  // Form handle submit with robust Mastercard validation
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cartItems.length === 0) {
      setError('Your shopping cart is currently empty.');
      return;
    }

    if (!isGatewayEnabled) {
      setError('Mastercard checkout processing is temporarily offline. Please clear your cart or try again later.');
      return;
    }

    // 1. Ship details verification
    if (!name.trim() || !email.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      setError('Please fill in all shipping fields correctly.');
      return;
    }

    // 2. Card details verification
    if (!cardholderName.trim()) {
      setError('Please enter the name printed on the card.');
      return;
    }

    const unspacedCardNumber = cardNumber.replace(/\s|-/g, '');
    if (!unspacedCardNumber || unspacedCardNumber.length !== 16) {
      setError('Please enter a valid 16-digit credit card number.');
      return;
    }

    if (expiry.length < 5) {
      setError('Please enter your card expiration date (MM/YY).');
      return;
    }

    if (cvv.length < 3) {
      setError('Please enter a valid card CVV security code.');
      return;
    }

    // 3. Strict Mastercard Check
    if (!isMastercard(unspacedCardNumber)) {
      setError('Only Mastercard payments are currently accepted. Please use a Mastercard or select another payment method.');
      return;
    }

    setIsSubmitting(true);

    const fullAddress = `${streetAddress}, ${city}, ${state} ${zipCode}`;

    // Assemble clean standard payload structure
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
      },
      payment_method: 'Mastercard',
      card_number: unspacedCardNumber
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
        // Clear client checkout cart 
        cartStore.clearCart();
        try {
          localStorage.removeItem('boutiq_cart');
        } catch (err) {}
        
        // Successful redirect
        router.push(`/success?orderId=${data.orderId}`);
      } else {
        setError(data.error || 'Check out failed. Verify inputs and try again.');
      }
    } catch (err: any) {
      console.error('Checkout fetch transmission crash:', err);
      setError('Network communication issue placing order. Please check connections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#d4af37] w-10 h-10" />
          <p className="text-gray-400 font-medium font-sans text-sm">Securing card gateway context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 font-sans" id="checkout-viewport">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 select-none">
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>

        <div className="border-b border-[#1f1f23] pb-6 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              Secure Gateway
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight text-white mt-2">
              Order Checkout
            </h1>
          </div>

          {/* Secure Trust badging */}
          <div className="flex items-center gap-4 bg-[#121214] border border-[#1f1f23] px-4 py-2.5 rounded-2xl">
            <ShieldCheck className="text-emerald-400 w-5 h-5 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] font-semibold text-gray-400 leading-tight">ENCRYPTED ENDPOINT</p>
              <p className="text-xs text-white font-mono font-bold leading-normal">AES_256_GCM ACTIVE</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-12 items-start" id="checkout-layout-grid">
          
          {/* Main User Form Fields */}
          <div className="space-y-8">
            <form onSubmit={handlePlaceOrder} className="space-y-8" id="checkout-form">
              
              {/* Submission error feedback banner */}
              {error && (
                <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-2xl p-5 text-sm font-medium flex items-start gap-3 animate-headshake">
                  <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Toggle offline warning */}
              {!isGatewayEnabled && (
                <div className="bg-yellow-950/30 border border-yellow-800 text-yellow-400 rounded-2xl p-5 text-sm font-medium flex items-start gap-3">
                  <Ban size={20} className="shrink-0 text-yellow-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Gateway Processing Paused</p>
                    <p className="text-xs text-gray-400">Mastercard payments are temporarily toggled off by the shop administrator. Checkouts are paused.</p>
                  </div>
                </div>
              )}

              {/* 1. SHIPPING INFO SECTION */}
              <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-mono font-bold">1</span>
                    Shipping Destination
                  </h2>
                  <span className="text-[10px] text-gray-500 font-bold">* REQUIRED FIELDS</span>
                </div>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Recipient Full Name *</label>
                      <input
                        type="text"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="Johnathan Doe"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Email Address (For Invoices) *</label>
                      <input
                        type="email"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="john@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400">Street Address *</label>
                    <input
                      type="text"
                      required
                      disabled={!isGatewayEnabled}
                      placeholder="123 Main St, Apt 4B"
                      value={streetAddress}
                      onChange={e => setStreetAddress(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">City *</label>
                      <input
                        type="text"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="Los Angeles"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">State / Province *</label>
                      <input
                        type="text"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="CA"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">ZIP / Postcode *</label>
                      <input
                        type="text"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="90001"
                        value={zipCode}
                        onChange={e => setZipCode(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. PAYMENT METHODS SECTION (MASTERCARD ONLY EXCLUSIVELY) */}
              <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1f1f23] pb-4 gap-3">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-mono font-bold">2</span>
                    Payment Details
                  </h2>
                  
                  {/* Mastercard Active Badge */}
                  <div className="flex items-center gap-1 bg-[#d4af37]/10 border border-[#d4af37]/30 px-3 py-1 rounded-full text-[10px] text-[#d4af37] font-bold">
                    <Check size={12} /> MASTERCARD ONLY ACCEPTED
                  </div>
                </div>

                {/* Important Mastercard restrict instructions banner */}
                <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 space-y-3">
                  <div className="flex gap-4">
                    {/* Live styled MC interlocking circles logo */}
                    <div className="shrink-0 flex items-center space-x-[-12px] h-10 select-none px-2 bg-[#09090b] rounded-lg border border-[#1d1d21]">
                      <div className="w-6 h-6 rounded-full bg-[#eb001b] opacity-95"></div>
                      <div className="w-6 h-6 rounded-full bg-[#ff5f00] opacity-90"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Mastercard Accepted Gateway</p>
                      <p className="text-xs text-gray-400 mt-1">
                        &quot;Mastercard payments are accepted. Payment instructions will be emailed immediately after your order is submitted.&quot;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accepted vs Rejected visualizing matrices */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#14231b] border border-emerald-950 rounded-2xl p-4">
                    <h5 className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Accepted Type
                    </h5>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center space-x-[-10px] select-none">
                        <div className="w-5 h-5 rounded-full bg-[#eb001b]"></div>
                        <div className="w-5 h-5 rounded-full bg-[#ff5f00]"></div>
                      </div>
                      <span className="text-xs font-bold text-white">Mastercard</span>
                    </div>
                  </div>

                  <div className="bg-[#241315]/80 border border-red-950 rounded-2xl p-4">
                    <h5 className="text-[11px] font-bold text-red-400 tracking-wider uppercase mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Strictly Not Accepted
                    </h5>
                    <div className="flex flex-wrap gap-2 items-center text-gray-500 text-[10px]">
                      <span className="line-through decoration-[#eb001b] decoration-2 font-semibold">Visa</span>
                      <span>•</span>
                      <span className="line-through decoration-[#eb001b] decoration-2 font-semibold">Amex</span>
                      <span>•</span>
                      <span className="line-through decoration-[#eb001b] decoration-2 font-semibold">Discover</span>
                    </div>
                  </div>
                </div>

                {/* Secure Card input schema */}
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Cardholder Name *</label>
                      <input
                        type="text"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="Johnathan R Doe"
                        value={cardholderName}
                        onChange={e => setCardholderName(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40 duration-155"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 flex justify-between items-center">
                        <span>Card Number *</span>
                        {detectedCard !== 'Unknown' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            detectedCard === 'Mastercard' ? 'bg-[#ff5f00]/15 text-white border border-[#ff5f00]/30' : 'bg-red-950 text-red-400 border border-red-800'
                          }`}>
                            {detectedCard}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          disabled={!isGatewayEnabled}
                          placeholder="5123 4567 8901 2345"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className={`w-full bg-[#18181c] border rounded-xl p-3.5 pl-11 outline-none text-white text-sm focus:bg-[#1f1f24] transition-all disabled:opacity-40 duration-155 ${
                            cardNumber.length > 0 && detectedCard !== 'Mastercard' && detectedCard !== 'Unknown'
                              ? 'border-red-600 focus:border-red-500'
                              : 'border-[#27272a] focus:border-[#d4af37]'
                          }`}
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                          {detectedCard === 'Mastercard' ? (
                            <div className="flex space-x-[-10px] select-none scale-90">
                              <div className="w-5 h-5 rounded-full bg-[#eb001b]"></div>
                              <div className="w-5 h-5 rounded-full bg-[#ff5f00]"></div>
                            </div>
                          ) : (
                            <CreditCard size={18} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Expiration Date *</label>
                      <input
                        type="text"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 flex items-center justify-between">
                        <span>CVV / CVC *</span>
                        <span title="3 or 4-digit code located on back of card"><HelpCircle size={12} className="text-gray-500 cursor-help" /></span>
                      </label>
                      <input
                        type="password"
                        required
                        disabled={!isGatewayEnabled}
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all disabled:opacity-40 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </section>

            </form>
          </div>

          {/* Cart aggregate summary sidebar panel */}
          <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 space-y-6" id="cart-summary-sidebar">
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
                {/* Scrollable list items summary */}
                <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.variant || ''}`} className="flex justify-between items-start text-xs gap-3 font-sans">
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

                {/* Subtotals */}
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
                    <span className="font-bold font-sans">Total</span>
                    <strong className="font-mono text-xl text-[#d4af37]">${subtotal.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Place Order submit hook CTA button */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || cartItems.length === 0 || !isGatewayEnabled}
                  className="w-full bg-[#d4af37] hover:bg-[#c5a030] text-black py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/10 select-none cursor-pointer duration-150"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" /> Securing Order...
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Submit Order (Mastercard)
                    </>
                  )}
                </button>
                
                <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1 select-none">
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
