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
  ShieldCheck,
  Plus,
  Tag,
  Coins,
  DollarSign,
  Smartphone,
  Truck,
  CheckSquare
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
  
  // Lazy state initializers to avoid cascading renders
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
  const [country, setCountry] = useState('United States');

  // Shipping Method state
  const [shippingMethod, setShippingMethod] = useState<'Normal' | 'Express' | 'Overnight' | null>(null);

  // Payment Method Polymorphism state
  const [paymentMethod, setPaymentMethod] = useState<'Cryptocurrency' | 'Apple Cash' | 'Chime'>('Cryptocurrency');
  const [cryptoCurrency, setCryptoCurrency] = useState<'Bitcoin' | 'USDT' | 'USDC' | 'Ethereum'>('Bitcoin');

  // Credit Card details state (optional based on method, only evaluated on Credit Card chosen)
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Coupon management state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Order Review confirmation checkbox
  const [isReviewedAndConfirmed, setIsReviewedAndConfirmed] = useState(false);

  // UI interaction state managers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state: calculate detected credit card type directly on render
  const detectedCard = cardNumber.length > 1 ? getCardType(cardNumber) : 'Unknown';

  // Initialize and load the cart store items + fetch active payment settings
  useEffect(() => {
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

  // Recalculation math:
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // 1. Coupon Discount Calculation
  const couponDiscountAmount = appliedCoupon ? Number((subtotal * (couponDiscountPercent / 100)).toFixed(2)) : 0;

  // 2. Crypto Discount Calculation (10% crypto discount applied after coupon deduction)
  const isCryptoSelected = paymentMethod === 'Cryptocurrency';
  const cryptoDiscountAmount = isCryptoSelected ? Number(((subtotal - couponDiscountAmount) * 0.1).toFixed(2)) : 0;

  // 3. Shipping Fee calculation
  let shippingCost = 0;
  if (shippingMethod === 'Normal') shippingCost = 20;
  if (shippingMethod === 'Express') shippingCost = 35;
  if (shippingMethod === 'Overnight') shippingCost = 60;

  // 4. Final grand total
  const finalTotal = subtotal - couponDiscountAmount - cryptoDiscountAmount + shippingCost;

  // Custom credit card field spacing formatter
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) {
      value = value.slice(0, 16);
    }
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

  // Coupon validation async caller
  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const inputCode = couponCodeInput.trim().toUpperCase();
    if (!inputCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setCouponError('Please specify your billing email address below before applying first-time discount.');
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const response = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), couponCode: inputCode })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAppliedCoupon(inputCode);
        setCouponDiscountPercent(data.discount_percentage);
        setCouponSuccess(data.message || '10% coupon applied!');
      } else {
        setCouponError(data.error || 'Invalid coupon.');
        setAppliedCoupon(null);
        setCouponDiscountPercent(0);
      }
    } catch (err) {
      console.error('Coupon request server communication error:', err);
      setCouponError('Server connection issue validating coupon. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Form handle submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cartItems.length === 0) {
      setError('Your shopping cart is currently empty.');
      return;
    }

    // 1. Check shipping selection
    if (!shippingMethod) {
      setError('Please select a Shipping Method before placing your order.');
      return;
    }

    // 2. Shipping Destination details verification
    if (!name.trim() || !email.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !country.trim()) {
      setError('Please enter complete shipping contact and recipient destination details.');
      return;
    }

    // 4. Force review confirmation
    if (!isReviewedAndConfirmed) {
      setError('Please review your order details below and check the confirmation box before placing your order.');
      return;
    }

    setIsSubmitting(true);

    const fullAddress = `${streetAddress}, ${city}, ${state} ${zipCode}`;
    const payload = {
      items: cartItems.map(item => ({
        id: item.id,
        name: item.variant ? `${item.name} (${item.variant})` : item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      })),
      customer: {
        name: name.trim(),
        email: email.trim(),
        address: fullAddress.trim(),
        country: country.trim()
      },
      shipping_method: shippingMethod,
      payment_method: paymentMethod === 'Cryptocurrency' ? `Cryptocurrency (${cryptoCurrency})` : paymentMethod,
      coupon_code: appliedCoupon,
      card_number: null
    };

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success === true) {
        cartStore.clearCart();
        try {
          localStorage.removeItem('boutiq_cart');
        } catch (err) {}
        
        router.push(`/success?orderId=${data.orderId}`);
      } else {
        setError(data.error || 'Checkout transaction failed. Verify details and try again.');
      }
    } catch (err: any) {
      console.error('Checkout fetch transmission exception:', err);
      setError('Server communication issue placing order. Please check connections.');
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
              Secure Distribution Gateway
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight text-white mt-2">
              Order Checkout Portal
            </h1>
          </div>

          <div className="flex items-center gap-4 bg-[#121214] border border-[#1f1f23] px-4 py-2.5 rounded-2xl">
            <ShieldCheck className="text-emerald-400 w-5 h-5 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] font-semibold text-gray-400 leading-tight">ENCRYPTED ENDPOINT</p>
              <p className="text-xs text-white font-mono font-bold leading-normal">AES_256_GCM ACTIVE</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_450px] gap-12 items-start" id="checkout-layout-grid-custom">
          
          {/* Main User Form Fields */}
          <div className="space-y-8">
            <form onSubmit={handlePlaceOrder} className="space-y-8" id="checkout-form-custom">
              
              {/* Submission error feedback banner */}
              {error && (
                <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-2xl p-5 text-sm font-medium flex items-start gap-3 animate-headshake" id="error-alert">
                  <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* 1. SHIPPING DESTINATION INFO */}
              <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6" id="sec-shipping-destination">
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
                        placeholder="Johnathan Doe"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Email Address (For Invoices) *</label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Street Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="123 Main St, Apt 4B"
                        value={streetAddress}
                        onChange={e => setStreetAddress(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">Country *</label>
                      <input
                        type="text"
                        required
                        placeholder="United States"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 outline-none text-white text-sm focus:border-[#d4af37] focus:bg-[#1f1f24] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400">City *</label>
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
                      <label className="text-xs font-bold text-gray-400">State / Province *</label>
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
                      <label className="text-xs font-bold text-gray-400">ZIP / Postcode *</label>
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

              {/* 2. SHIPPING METHOD SELECTION */}
              <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6" id="sec-shipping-method">
                <div className="border-b border-[#1f1f23] pb-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-mono font-bold">2</span>
                    Shipping Logistics *
                  </h2>
                  <span className="text-xs text-[#d4af37] font-semibold">Select Priority</span>
                </div>

                <div className="grid md:grid-cols-3 gap-4" id="shipping-priority-selection">
                  {[
                    { key: 'Normal', title: 'Normal Shipping', time: '3–5 Business Days', fee: 20 },
                    { key: 'Express', title: 'Express Shipping', time: '48 Hours', fee: 35 },
                    { key: 'Overnight', title: 'Overnight Shipping', time: '24 Hours', fee: 60 }
                  ].map((option) => (
                    <div 
                      key={option.key}
                      onClick={() => setShippingMethod(option.key as any)}
                      className={`border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#18181c] ${
                        shippingMethod === option.key 
                          ? 'border-[#d4af37] bg-[#d4af37]/5' 
                          : 'border-[#27272a] bg-[#121214]'
                      }`}
                      id={`ship-option-${option.key}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-white mb-1 flex justify-between items-center">
                          <span>{option.title}</span>
                          {shippingMethod === option.key && <CheckCircle2 size={16} className="text-[#d4af37]" />}
                        </p>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                          <Truck size={12} /> {option.time}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#1f1f23] flex justify-between items-baseline">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated Fee</span>
                        <span className="text-sm font-mono font-bold text-[#d4af37]">+${option.fee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. POLYMORPHIC PAYMENT METHOD SELECTOR */}
              <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6" id="sec-payment-method">
                <div className="border-b border-[#1f1f23] pb-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs font-mono font-bold">3</span>
                    Pre-authorization Method
                  </h2>
                  <span className="text-[10px] text-gray-500 font-bold">VERIFICATION CODES SENT DIRECTLY</span>
                </div>

                {/* Main method tabs */}
                <div className="grid grid-cols-3 gap-2 bg-[#09090b] p-1.5 rounded-2xl border border-[#1f1f23]">
                  {[
                    { key: 'Cryptocurrency', label: 'Crypto', icon: Coins },
                    { key: 'Apple Cash', label: 'Apple Cash', icon: Smartphone },
                    { key: 'Chime', label: 'Chime', icon: DollarSign }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(item.key as any);
                          setError(null);
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          paymentMethod === item.key 
                            ? 'bg-[#d4af37] text-black shadow-md' 
                            : 'text-gray-400 hover:text-white hover:bg-[#121214]'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-content structures */}
                <div className="space-y-4">
                  {paymentMethod === 'Cryptocurrency' && (
                    <div className="space-y-4 bg-[#18181c] border border-[#27272a] rounded-2xl p-5 md:p-6 animate-fadeIn">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                          <Coins className="w-4 h-4" /> 10% Crypto Discount Applied!
                        </p>
                        <p className="text-xs text-gray-300">
                          &quot;Payment instructions and wallet details will be emailed immediately after your order is submitted.&quot;
                        </p>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-[#27272a]">
                        <label className="text-xs font-bold text-gray-400">Choose preferred crypto payment token *</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { key: 'Bitcoin', label: 'Bitcoin' },
                            { key: 'USDT', label: 'USDT (ERC20)' },
                            { key: 'USDC', label: 'USDC (ERC20)' },
                            { key: 'Ethereum', label: 'Ethereum' }
                          ].map((token) => (
                            <button
                              key={token.key}
                              type="button"
                              onClick={() => setCryptoCurrency(token.key as any)}
                              className={`py-2 px-1 text-xs font-bold border rounded-xl transition-all ${
                                cryptoCurrency === token.key
                                  ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                                  : 'border-[#27272a] bg-[#121214] text-gray-400 hover:text-white'
                              }`}
                            >
                              {token.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Apple Cash' && (
                    <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 md:p-6 space-y-2 animate-fadeIn">
                      <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone size={16} className="text-[#d4af37]" /> Apple Cash Delivery
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        &quot;Apple Cash payment instructions will be emailed immediately after your order is submitted.&quot;
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'Chime' && (
                    <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 md:p-6 space-y-2 animate-fadeIn">
                      <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={16} className="text-[#d4af37]" /> Chime Immediate Hold
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        &quot;Chime payment instructions will be emailed immediately after your order is submitted.&quot;
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* 4. COUPON CODE LOGIC FORM */}
              <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-4" id="sec-coupon">
                <div className="flex items-center gap-2 text-white border-b border-[#1f1f23] pb-3">
                  <Tag className="text-[#d4af37]" size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Have a coupon code?</h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled={isValidatingCoupon}
                    placeholder="e.g. WELCOME10"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="bg-[#18181c] border border-[#27272a] rounded-xl outline-none text-white text-xs px-3 py-2 focus:border-[#d4af37] flex-1 font-mono uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !email.trim()}
                    className="bg-[#27272a] hover:bg-[#323236] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-30 select-none cursor-pointer"
                  >
                    {isValidatingCoupon ? <RefreshCw className="animate-spin w-4 h-4 inline" /> : 'Apply Coupon'}
                  </button>
                </div>

                {!email.trim() && (
                  <p className="text-[10px] text-gray-500">
                    * Please specify your email under shipping destination first to unlock verification.
                  </p>
                )}

                {couponError && <p className="text-xs text-red-400 font-medium" id="coupon-error-notice">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-emerald-400 font-semibold" id="coupon-success-notice">{couponSuccess}</p>}
              </section>

              {/* 5. CHECKOUT REVIEW SECTION */}
              <section className="bg-[#121214] border border-[#d4af37]/30 rounded-3xl p-6 md:p-8 space-y-6" id="sec-checkout-review">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white border-b border-[#1f1f23] pb-4">
                  <CheckSquare className="text-[#d4af37]" size={18} />
                  Checkout Review & Verify
                </h2>

                <div className="grid md:grid-cols-2 gap-6 text-xs text-gray-300">
                  <div className="space-y-3 bg-[#18181c] p-4 rounded-2xl border border-[#27272a]">
                    <h4 className="font-bold text-white border-b border-[#27272a] pb-1 uppercase tracking-wider text-[10px]">Customer Information</h4>
                    <p><strong>Name:</strong> {name || <span className="text-red-500 font-bold">Unentered</span>}</p>
                    <p><strong>Email ID:</strong> {email || <span className="text-red-500 font-bold">Unentered</span>}</p>
                    <p><strong>Country:</strong> {country}</p>
                  </div>

                  <div className="space-y-3 bg-[#18181c] p-4 rounded-2xl border border-[#27272a]">
                    <h4 className="font-bold text-white border-b border-[#27272a] pb-1 uppercase tracking-wider text-[10px]">Logistics & Payments</h4>
                    <p><strong>Shipping:</strong> {shippingMethod ? `${shippingMethod} Shipping` : <span className="text-red-500 font-bold">Unselected</span>}</p>
                    <p><strong>Payment Choice:</strong> {paymentMethod === 'Cryptocurrency' ? `Cryptocurrency (${cryptoCurrency})` : paymentMethod}</p>
                  </div>
                </div>

                {streetAddress && city && state && zipCode && (
                  <div className="bg-[#18181c] p-4 rounded-2xl border border-[#27272a] text-xs space-y-1">
                    <span className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Shipping Destination Address</span>
                    <p className="text-white font-medium">{streetAddress}, {city}, {state} {zipCode}</p>
                  </div>
                )}

                {/* Items preview list */}
                <div className="border-t border-[#1f1f23] pt-4">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-3">Products Ordered Details</span>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={`${item.id}-${item.variant || ''}`} className="flex justify-between items-center text-xs text-gray-300">
                        <span>{item.name} {item.variant ? `(${item.variant})` : ''} <strong className="text-white">x{item.quantity}</strong></span>
                        <span className="font-mono font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic review summary of fees */}
                <div className="border-t border-[#1f1f23] pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Product Subtotal</span>
                    <span className="font-mono font-bold text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-red-400">
                      <span>Coupon Discount [WELCOME10 - 10%]</span>
                      <span className="font-mono font-bold">-${couponDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {isCryptoSelected && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Crypto Discount [10%]</span>
                      <span className="font-mono font-bold">-${cryptoDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {shippingMethod && (
                    <div className="flex justify-between text-gray-400">
                      <span>Shipping Logistics Fee</span>
                      <span className="font-mono font-bold text-white">${shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#1f1f23] text-sm text-white font-bold">
                    <span>Grand Total</span>
                    <span className="text-lg font-mono text-[#d4af37]">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Confirm checkbox */}
                <div className="bg-[#1c1c20] border border-[#27272a] rounded-2xl p-4 flex gap-3 items-start select-none cursor-pointer" onClick={() => setIsReviewedAndConfirmed(!isReviewedAndConfirmed)}>
                  <input
                    type="checkbox"
                    required
                    checked={isReviewedAndConfirmed}
                    onChange={(e) => setIsReviewedAndConfirmed(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#d4af37] border-2 border-zinc-700 rounded bg-[#18181c] cursor-pointer mt-0.5 shrink-0"
                    id="confirm-checkout-checkbox"
                  />
                  <div className="text-xs text-gray-300">
                    <p className="font-bold text-white">Review Confirmation *</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">I confirm that all recipient details, shipping options, and payment methods are accurate. I understand that secure payment instructions will be generated and emailed immediately after submission.</p>
                  </div>
                </div>
              </section>

            </form>
          </div>

          {/* Cart aggregate summary sidebar panel */}
          <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 space-y-6 self-start" id="cart-summary-sidebar-custom">
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
                <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
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

                {/* Subtotals breakdown list matching requirements exactly */}
                <div className="border-t border-[#1f1f23] pt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-white font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-red-500">
                      <span>Coupon Discount ({appliedCoupon})</span>
                      <span className="font-mono font-bold">-${couponDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {isCryptoSelected && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Crypto Discount (10%)</span>
                      <span className="font-mono font-bold">-${cryptoDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping Fee</span>
                    <span className="font-mono text-white font-bold">
                      {shippingMethod ? `$${shippingCost.toFixed(2)}` : <span className="italic text-gray-500 text-xs">Awaiting option</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-white border-t border-[#1f1f23] pt-3">
                    <span className="font-bold font-sans">Grand Total</span>
                    <strong className="font-mono text-xl text-[#d4af37]">${finalTotal.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Action submit button */}
                <button
                  type="submit"
                  form="checkout-form-custom"
                  disabled={isSubmitting || cartItems.length === 0 || !isReviewedAndConfirmed}
                  className="w-full bg-[#d4af37] hover:bg-[#c5a030] text-black py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#d4af37]/10 select-none cursor-pointer duration-150"
                  id="btn-place-order"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4" /> Securing Order Details...
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Place Order & Request Details
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
