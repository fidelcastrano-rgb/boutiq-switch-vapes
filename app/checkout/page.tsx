'use client';

import { useEffect, useState, useRef } from 'react';
import { cartStore, CartItem } from '@/lib/cart';
import { 
  AlertCircle, Lock, Mail, Truck, CreditCard, Bitcoin, 
  CheckCircle2, ShoppingBag, Trash2, ArrowLeft, RefreshCw, Sparkles 
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  
  // Form coordinates
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [couponCode, setCouponCode] = useState('');
  
  // Coupon verification state
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Checkout process state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    grandTotal: number;
    message: string;
  } | null>(null);

  // Background abandoned cart sync timer
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize and subscribe to the cart store
  useEffect(() => {
    let storedId = '';
    try {
      storedId = localStorage.getItem('boutiq_cart_id') || '';
      if (!storedId) {
        storedId = 'cart_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        localStorage.setItem('boutiq_cart_id', storedId);
      }
    } catch (err) {
      storedId = 'cart_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartId(storedId);

    // Initial cart load
    setCartItems([...cartStore.getItems()]);
    setMounted(true);

    // Subscribe to cart store updates
    const unsubscribe = cartStore.subscribe(() => {
      setCartItems([...cartStore.getItems()]);
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);
  
  // Compute subtotal on cart changes
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // 2. Shipping logic determinations
  const isNorthAmerica = formData.country === 'US' || formData.country === 'CA';


  let shippingCost = 20; // default standard
  if (subtotal >= 500) {
    shippingCost = 0; // FREE Shipping on orders $500 or more
  } else {
    if (isNorthAmerica) {
      shippingCost = shippingMethod === 'express' ? 60 : 20;
    } else {
      shippingCost = 55; // International Shipping
    }
  }

  // 3. Discount logic
  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = (subtotal * appliedCoupon.percent) / 100;
  }

  const cryptoDiscount = paymentMethod === 'crypto' ? (subtotal * 0.10) : 0;
  const grandTotal = Math.max(0, subtotal - (couponDiscount + cryptoDiscount) + shippingCost);

  // 4. Payment validations
  const paymentRequiresMin = paymentMethod !== 'crypto';
  const isPaymentViolated = paymentRequiresMin && subtotal < 150;
  const paymentErrorMessage = isPaymentViolated 
    ? 'Minimum order amount for this payment method is $150.'
    : null;

  // 5. Background sync for abandoned cart tracking
  const triggerAbandonedCartSync = (updatedEmail: string, updatedName: string, items: CartItem[]) => {
    if (!cartId || !updatedEmail || !updatedEmail.includes('@') || !updatedEmail.includes('.')) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/abandoned-carts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: cartId,
            customer_email: updatedEmail,
            customer_name: updatedName,
            cart_items: items
          })
        });
      } catch (err) {
        console.warn('Background abandoned cart synchronization failed:', err);
      }
    }, 1500); // 1.5 seconds debounce
  };

  const handleInputChange = (field: string, value: string) => {
    const nextForm = { ...formData, [field]: value };
    setFormData(nextForm);
    
    // Automatically adjust shipping methods when country updates
    if (field === 'country') {
      const isNA = value === 'US' || value === 'CA';
      if (!isNA) {
        setShippingMethod('international');
      } else if (shippingMethod === 'international') {
        setShippingMethod('standard');
      }
    }
    
    // Trigger cart synchronization in the background
    triggerAbandonedCartSync(nextForm.email, nextForm.name, cartItems);
  };

  // Re-trigger sync if items/quantity change
  useEffect(() => {
    if (formData.email && cartItems.length > 0) {
      triggerAbandonedCartSync(formData.email, formData.name, cartItems);
    }
  }, [cartItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // 6. Handle Coupon Check
  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAppliedCoupon({
          code: data.code,
          percent: data.discount_percent
        });
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Network error checking coupon.');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // 7. Complete Secure Placement Call
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPaymentViolated) {
      setCheckoutError('Minimum order amount for this payment method is $150.');
      return;
    }

    if (cartItems.length === 0) {
      setCheckoutError('Your shopping cart is currently empty.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone || null,
          shipping_address: formData.address,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          zip_code: formData.zip,
          payment_method: paymentMethod,
          shipping_method: shippingMethod,
          cart_items: cartItems.map(item => ({
            productId: item.id,
            variant: item.variant,
            quantity: item.quantity,
            price: item.price
          })),
          coupon_code: appliedCoupon?.code || null,
          cart_id: cartId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Successful order!
        setOrderSuccess({
          orderNumber: data.orderNumber,
          grandTotal: data.grandTotal,
          message: data.message
        });
        // Clear local shopping cart and tracking
        cartStore.clearCart();
        try {
          localStorage.removeItem('boutiq_cart');
          localStorage.removeItem('boutiq_cart_id');
        } catch(e) {
          // Ignored
        }
      } else {
        console.error('Checkout API returned error:', data.error);
        setCheckoutError(data.error || 'Checkout registration failed.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Fetch Checkout Error:', err);
      setCheckoutError('Network error registering checkout. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <ShoppingBag className="text-text-secondary w-12 h-12 mb-4" />
          <p className="text-text-secondary font-medium">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  // SUCCESS LAYOUT PAGE
  if (orderSuccess) {
    const getInstructions = () => {
      switch (paymentMethod) {
        case 'crypto':
          return (
            <div className="bg-success/5 border border-success/20 rounded-2xl p-6 text-left space-y-4">
              <h3 className="font-heading font-bold text-lg text-success flex items-center gap-2">
                <Bitcoin size={20} className="text-success inline" /> Send Crypto Payment (10% Discount Applied!)
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Thank you for choosing high-privacy Cryptocurrency. Send exact total value below to one of our verified wallets to activate processing immediately:
              </p>
              <div className="space-y-3 font-mono text-xs bg-secondary-bg p-4 rounded-xl border border-border-soft overflow-x-auto text-text-primary">
                <div>
                  <span className="text-text-secondary select-none font-sans block text-[10px] uppercase tracking-wider mb-0.5">USDT (TRC20 Wallet Address)</span>
                  <strong className="select-all block p-2 bg-main-bg border border-border-soft rounded">TTxB6Yf8Nsh9P2uVvBns8Y7uQns92bC7xY</strong>
                </div>
                <div className="pt-2">
                  <span className="text-text-secondary select-none font-sans block text-[10px] uppercase tracking-wider mb-0.5">Bitcoin (BTC Wallet Address)</span>
                  <strong className="select-all block p-2 bg-main-bg border border-border-soft rounded">bc1q7y9wsh2bcy97sw8ynshwu872bnw0a9ws7ynsqq</strong>
                </div>
                <div className="pt-2">
                  <span className="text-text-secondary select-none font-sans block text-[10px] uppercase tracking-wider mb-0.5">Ethereum (ETH Wallet Address)</span>
                  <strong className="select-all block p-2 bg-main-bg border border-border-soft rounded">0x7Bd3b9C4f7C2bDeCDe9B2Bde33De73FDE9B969FF</strong>
                </div>
              </div>
              <p className="text-xs text-text-secondary italic">
                Once transfer is complete, please email a transaction confirmation screenshot to <strong>sales@boutiqswitchvapes.us</strong> to flag shipment dispatch!
              </p>
            </div>
          );
        case 'chime':
          return (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-left space-y-3">
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center gap-2">
                Chime Payment Pending
              </h3>
              <p className="text-sm text-text-secondary">
                To pay using Chime routing, please send exact total to the handle below, citing your order number in Chime notes:
              </p>
              <div className="p-4 bg-secondary-bg rounded-xl border border-border-soft font-mono text-sm text-center">
                <strong>Chime Handle:</strong> <span className="text-primary font-bold select-all">$BoutiqSwitchDistro</span>
              </div>
              <p className="text-xs text-text-secondary text-center">
                Please monitor your inbox for detailed payment invoices and tracking vouchers shortly.
              </p>
            </div>
          );
        case 'apple-cash':
          return (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-left space-y-3">
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Apple Cash Instructions
              </h3>
              <p className="text-sm text-text-secondary">
                To submit Apple Cash, execute a secure transfer to the registered business line below:
              </p>
              <div className="p-4 bg-secondary-bg rounded-xl border border-border-soft font-mono text-sm text-center">
                <strong>Apple Cash Number:</strong> <span className="text-primary font-bold select-all">+1 (650) 843-9821</span>
              </div>
              <p className="text-xs text-text-secondary text-center text-rose-500 font-medium">
                Include your order identifier <strong>{orderSuccess.orderNumber}</strong> in standard message notes during deposit.
              </p>
            </div>
          );
        default:
          return (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-left space-y-3">
              <h3 className="font-heading font-bold text-lg text-text-primary">
                MasterCard Invoice Sent
              </h3>
              <p className="text-sm text-text-secondary">
                A private billing link is being prepared for your transaction card total. Check your inbox:
              </p>
              <div className="p-4 bg-secondary-bg rounded-xl border border-border-soft text-sm text-center">
                <strong>Registered Email:</strong> <span className="font-mono text-text-primary font-medium">{formData.email}</span>
              </div>
              <p className="text-xs text-text-secondary">
                Please follow the verification and invoice instructions inside the email to finalize credit card clearance securely.
              </p>
            </div>
          );
      }
    };

    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-8 animate-fade-in" id="success-screen">
        <CheckCircle2 size={80} className="text-success mx-auto animate-pulse" />
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary">Order Registered!</h1>
          <p className="text-text-secondary">Order Reference: <strong className="font-mono text-text-primary">{orderSuccess.orderNumber}</strong></p>
        </div>
        
        <div className="bg-secondary-bg p-6 rounded-3xl border border-border-soft space-y-4">
          <div className="flex justify-between items-center text-sm border-b border-border-soft/60 pb-3">
            <span className="text-text-secondary">Invoice Amount</span>
            <strong className="text-2xl font-bold text-text-primary">${orderSuccess.grandTotal.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary">Payment Method</span>
            <span className="font-mono font-bold uppercase text-xs tracking-wider bg-border-soft px-3 py-1 rounded-full text-text-primary">{paymentMethod.replace('-', ' ')}</span>
          </div>
        </div>

        {getInstructions()}

        <p className="text-sm text-text-secondary leading-relaxed">
          {orderSuccess.message} A copy of the payment receipt was dispatched to <strong>{formData.email}</strong>.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Link href="/products" className="flex-1 bg-text-primary text-main-bg py-3.5 rounded-xl font-bold hover:bg-text-primary/90 transition-colors">
            Continue Shopping
          </Link>
          <a href="https://wa.me/1234567890" target="_blank" className="flex-1 bg-success text-white py-3.5 rounded-xl font-bold hover:bg-success/90 transition-colors flex items-center justify-center gap-2">
            Talk to Live Agent (WhatsApp)
          </a>
        </div>
        
        <p className="text-[10px] text-text-secondary opacity-60">
          Disclaimer: Products contain THC substances. For medical and recreational use. Keep out of reach of children.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 bg-main-bg" id="checkout-main">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-10 text-text-primary">Secure Checkout</h1>
      
      {/* Dynamic Announcement Banner in Checkout Page */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 mb-8 text-center text-xs font-mono tracking-wide flex justify-center items-center gap-6 overflow-x-auto text-text-primary select-none">
        <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> FREE SHIPPING ON ORDERS OVER $500</span>
        <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> 10% OFF ALL CRYPTO ORDERS</span>
        <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> CODE: WELCOME10 SAVES 10%</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
        
        {/* Left Column: Checkout Inputs Form */}
        <form onSubmit={handleFormSubmit} className="space-y-8" id="checkout-form">
          
          {checkoutError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm font-medium flex items-start gap-2">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Shipping Details Section */}
          <section className="bg-transparent p-6 rounded-3xl border border-border-soft shadow-sm space-y-6">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2 text-text-primary">
               <Truck className="text-primary w-5 h-5"/> Shipping Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <input 
                  type="email" 
                  placeholder="Email Address (For Invoices & Tracking) *" 
                  required 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.email} 
                  onChange={e => handleInputChange('email', e.target.value)} 
                />
              </div>
              
              <div className="sm:col-span-2 space-y-1">
                <input 
                  type="text" 
                  placeholder="Full Name *" 
                  required 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.name} 
                  onChange={e => handleInputChange('name', e.target.value)} 
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <input 
                  type="tel" 
                  placeholder="Phone Number (SMS Notifications)" 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.phone} 
                  onChange={e => handleInputChange('phone', e.target.value)} 
                />
              </div>
              
              <div className="sm:col-span-2 space-y-1">
                <input 
                  type="text" 
                  placeholder="Street Address, Apt, Suite *" 
                  required 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.address} 
                  onChange={e => handleInputChange('address', e.target.value)} 
                />
              </div>
              
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="City *" 
                  required 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.city} 
                  onChange={e => handleInputChange('city', e.target.value)} 
                />
              </div>
              
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="State / Province *" 
                  required 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.state} 
                  onChange={e => handleInputChange('state', e.target.value)} 
                />
              </div>
              
              <div className="space-y-1">
                <input 
                  type="text" 
                  placeholder="ZIP / Postal Code *" 
                  required 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all focus:bg-main-bg" 
                  value={formData.zip} 
                  onChange={e => handleInputChange('zip', e.target.value)} 
                />
              </div>
              
              <div className="space-y-1">
                <select 
                  className="w-full border border-border-soft rounded-xl p-3.5 bg-secondary-bg focus:border-primary outline-none text-text-primary text-sm transition-all cursor-pointer h-full" 
                  value={formData.country} 
                  onChange={e => handleInputChange('country', e.target.value)}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                </select>
              </div>
            </div>
          </section>

          {/* Shipping Methods Section */}
          <section className="bg-transparent p-6 rounded-3xl border border-border-soft shadow-sm space-y-4">
            <h2 className="text-xl font-heading font-bold text-text-primary flex items-center gap-2">
              Delivery Shipping Methods
            </h2>
            
            {subtotal >= 500 ? (
              <div className="p-4 bg-success/10 border border-success/30 rounded-xl flex items-center justify-between">
                <span className="text-success text-sm font-bold flex items-center gap-1.5 leading-none">
                  <CheckCircle2 size={16} /> Free Shipping Active (Subtotal Over $500)
                </span>
                <span className="font-mono text-sm font-bold text-success">$0.00</span>
              </div>
            ) : (
              <div className="space-y-3">
                {isNorthAmerica ? (
                  <>
                    <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border-soft hover:bg-secondary-bg'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="shipping" 
                          checked={shippingMethod === 'standard'} 
                          onChange={() => setShippingMethod('standard')} 
                          className="w-4 h-4 text-primary" 
                        />
                        <span className="font-medium text-text-primary text-sm">Normal Shipping (3-5 Business Days)</span>
                      </div>
                      <span className="font-bold text-text-primary font-mono text-sm">$20.00</span>
                    </label>
                    <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${shippingMethod === 'express' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border-soft hover:bg-secondary-bg'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="shipping" 
                          checked={shippingMethod === 'express'} 
                          onChange={() => setShippingMethod('express')} 
                          className="w-4 h-4 text-primary" 
                        />
                        <span className="font-medium text-text-primary text-sm">Express Shipping (24 Hours Guarantee)</span>
                      </div>
                      <span className="font-bold text-text-primary font-mono text-sm">$60.00</span>
                    </label>
                  </>
                ) : (
                  <label className="flex items-center justify-between p-4 border border-primary bg-primary/5 rounded-xl shadow-sm cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="shipping" 
                        checked={true} 
                        readOnly 
                        className="w-4 h-4 text-primary" 
                      />
                      <span className="font-medium text-text-primary text-sm">International Bulk Delivery</span>
                    </div>
                    <span className="font-bold text-text-primary font-mono text-sm">$55.00</span>
                  </label>
                )}
              </div>
            )}
          </section>

          {/* Payment Method Section */}
          <section className="bg-transparent p-6 rounded-3xl border border-border-soft shadow-sm space-y-6">
            <h2 className="text-xl font-heading font-bold flex items-center gap-2 text-text-primary">
               <Lock className="text-primary w-5 h-5"/> Safe Secure Payment
            </h2>
            
            {/* Crypto Discount Banner Notification */}
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-start gap-3">
               <Bitcoin className="text-success shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-sm text-text-primary font-bold">Cryptocurrency is recommended for complete privacy.</p>
                 <p className="text-xs text-success font-bold">10% discount is automatically deducted for Bitcoin, USDT, or Ethereum transfers.</p>
               </div>
            </div>

            {paymentErrorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 animate-bounce" /> <span>{paymentErrorMessage}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { method: 'crypto', label: 'Cryptocurrency', badge: '10% OFF' },
                { method: 'chime', label: 'Chime routing', badge: 'Min $150' },
                { method: 'apple-cash', label: 'Apple Cash Pay', badge: 'Min $150' },
                { method: 'credit-card', label: 'Credit Card (MC)', badge: 'Min $150' },
              ].map((item) => {
                const isMethodDisabled = item.method !== 'crypto' && subtotal < 150;
                return (
                  <label 
                    key={item.method} 
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === item.method 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : isMethodDisabled 
                          ? 'border-border-soft opacity-40 bg-secondary-bg/50 cursor-not-allowed'
                          : 'border-border-soft bg-secondary-bg hover:bg-border-soft/25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        disabled={isMethodDisabled}
                        checked={paymentMethod === item.method} 
                        onChange={() => setPaymentMethod(item.method)} 
                        className="w-4 h-4 text-primary cursor-pointer disabled:cursor-not-allowed" 
                      />
                      <span className="font-bold text-text-primary text-sm">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.method === 'crypto' 
                        ? 'bg-success/20 text-success' 
                        : isMethodDisabled
                          ? 'bg-red-100 text-red-500'
                          : 'bg-primary/20 text-primary'
                    }`}>
                      {item.badge}
                    </span>
                  </label>
                )
              })}
            </div>
            
            {paymentMethod !== 'crypto' && (
              <p className="text-xs text-text-secondary">
                📢 Payment instructions will be dispatched to <strong>{formData.email || 'your email'}</strong> once you place the order.
              </p>
            )}
          </section>

        </form>

        {/* Right Column: Dynamic Order Summary and Live Cart Details */}
        <div className="sticky top-24 space-y-6" id="order-summary-sidebar">
          
          <div className="bg-text-primary text-main-bg p-6 rounded-3xl shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-main-bg/10 pb-4">
              <h2 className="text-lg font-heading font-bold">Order Summary</h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-main-bg/10 text-main-bg/85 font-bold uppercase">{cartItems.length} Products</span>
            </div>
            
            {/* Live Cart Items Loop */}
            <div className="max-h-[220px] overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-main-bg/25 border-b border-main-bg/10 pb-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.variant}`} className="flex justify-between text-xs gap-3">
                  <div className="space-y-1">
                    <p className="font-bold leading-tight line-clamp-1">{item.name}</p>
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-[10px] bg-main-bg/10 px-2 py-0.5 rounded text-main-bg/80 capitalize">{item.variant}</span>
                      <span className="text-main-bg/60">x {item.quantity}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-bold font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      type="button"
                      onClick={() => cartStore.removeItem(item.id, item.variant)}
                      className="text-main-bg/40 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Coupon input validation */}
            <div className="space-y-1">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="WELCOME10" 
                  value={couponCode} 
                  onChange={e => setCouponCode(e.target.value)} 
                  className="w-full bg-main-bg/10 border border-main-bg/20 rounded-xl px-4 py-2 text-xs text-main-bg placeholder:text-main-bg/45 focus:outline-none focus:border-main-bg transition-all"
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon} 
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="bg-main-bg text-text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-main-bg/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isValidatingCoupon ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-[10px] text-red-300 font-medium pl-1">{couponError}</p>}
            </div>

            {appliedCoupon && (
              <div className="bg-success/20 border border-success/30 rounded-xl p-3 flex justify-between items-center text-xs animate-pulse">
                <span className="font-bold text-success-light flex items-center gap-1">🎉 Coupon: {appliedCoupon.code}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-success-light">-{appliedCoupon.percent}%</span>
                  <button type="button" onClick={() => setAppliedCoupon(null)} className="text-main-bg/40 hover:text-main-bg text-xs">Remove</button>
                </div>
              </div>
            )}

            {/* Calculative Breakdowns */}
            <div className="space-y-3.5 text-xs border-b border-main-bg/10 pb-4">
              <div className="flex justify-between text-main-bg/85 font-mono">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-main-bg/85">
                <span>Delivery Shipping</span>
                <span className="font-mono">{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-yellow-400 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.percent}%)</span>
                  <span className="font-mono">-${couponDiscount.toFixed(2)}</span>
                </div>
              )}

              {cryptoDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Crypto Discount (10%)</span>
                  <span className="font-mono">-${cryptoDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center py-2">
              <div className="space-y-0.5">
                <span className="font-bold text-sm block">Invoice Total</span>
                <span className="text-[9px] font-mono text-main-bg/60 bg-main-bg/5 px-2 py-0.5 rounded tracking-widest uppercase">
                  Est Delivery: {subtotal >= 500 || shippingMethod === 'express' ? '24 Hours' : '3-5 Business Days'}
                </span>
              </div>
              <span className="text-2xl font-heading font-bold text-primary font-mono">${grandTotal.toFixed(2)}</span>
            </div>

            <button 
              type="submit"
              form="checkout-form"
              disabled={isSubmitting || isPaymentViolated || cartItems.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPaymentViolated || cartItems.length === 0
                  ? 'bg-main-bg/20 text-main-bg/40 cursor-not-allowed' 
                  : 'bg-primary text-main-bg hover:bg-accent hover:-translate-y-0.5 shadow-lg shadow-primary/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="animate-spin w-5 h-5" /> Submitting Order...
                </>
              ) : (
                'Place Order Securely'
              )}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-main-bg/50">
               <Lock size={12} /> SSL Secured Encrypted Gateways
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
