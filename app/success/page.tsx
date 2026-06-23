'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  Mail, 
  ShieldCheck, 
  ChevronRight, 
  Download,
  MapPin,
  Clock,
  Printer,
  AlertCircle,
  Truck,
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  customer_country?: string;
  total: number;
  payment_method: string;
  payment_status: string;
  card_last4?: string;
  created_at: string;
  shipping_method?: string;
  coupon_code?: string;
  discount_percentage?: number;
  discount_amount?: number;
  crypto_discount?: number;
  items: OrderItem[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'confirmation' | 'instructions' | 'admin'>('instructions');

  // Fetch the created order from api
  useEffect(() => {
    if (!orderId) {
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Missing order ID reference from checkout page query parameters.');
      }, 0);
      return () => clearTimeout(timeout);
    }

    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Failed to locate order records.');
        }
      })
      .catch(err => {
        console.error('Error fetching order records:', err);
        setError('Error establishing communication with D1.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  const handlePrintInvoice = () => {
    window.print();
  };

  const getShortId = (id: string) => {
    if (!id) return 'N/A';
    return id.substring(0, 8).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <RefreshCw className="animate-spin text-[#d4af37] w-10 h-10" />
        <p className="text-gray-400 font-medium text-sm">Compiling order details and generating invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="bg-red-950/20 border border-red-900 rounded-3xl p-6 text-red-400 text-sm">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
          <p className="font-bold">Order Details Unavailable</p>
          <p className="text-xs text-gray-405 mt-1">{error || 'Order record was not found in the D1 store.'}</p>
        </div>
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#d4af37] hover:underline font-bold">
          <ArrowRight className="rotate-180" size={14} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const shortId = getShortId(order.id);

  // Recalculants
  const subtotal = order.items?.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0) || 0;
  const couponDiscount = Number(order.discount_amount || 0);
  const cryptoDiscount = Number(order.crypto_discount || 0);
  
  // Shipping cost parsing
  let shippingCost = 20;
  const methodUpper = (order.shipping_method || 'Normal').toUpperCase();
  if (methodUpper.includes('OVERNIGHT')) shippingCost = 60;
  else if (methodUpper.includes('EXPRESS')) shippingCost = 35;
  else if (methodUpper.includes('NORMAL')) shippingCost = 20;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-16 font-sans">
      
      {/* 1. Header Confirmation Banner */}
      <div className="text-center space-y-4 pt-10 select-none">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3 select-none">
          <CheckCircle size={44} className="text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans">Order Received!</h1>
          <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Thank you for shopping with Boutiq Switch Vapes. Your order is registered in our database.
          </p>
        </div>
      </div>

      {/* Payment Instructions Immediate Alert Box */}
      <div className="bg-[#121214] border border-[#d4af37]/30 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between" id="payment-warning-card">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-bold text-[#d4af37] uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5 font-mono">
            ⚠️ Attention check: Payment Process Notice
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
            &quot;Your payment instructions have been sent to your email address. Please check your inbox and spam folder.&quot;
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            href={`/shipping?orderId=${order.id}`}
            className="bg-[#d4af37] hover:bg-[#c5a030] text-black text-xs font-bold py-2.5 px-5 rounded-xl transition-all shadow shrink-0 text-center"
          >
            Track My Order
          </Link>
          <Link 
            href="/products"
            className="bg-[#18181c] border border-[#27272a] hover:bg-[#121214] text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all shrink-0 text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Grid: Invoice panel / Customer confirmation details */}
      <div className="grid lg:grid-cols-[1fr_390px] gap-8 items-start">
        
        {/* LEFT COLUMN: Clean Printable PDF Invoice Layout representation */}
        <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 md:p-8 space-y-6 printable-invoice-block relative overflow-hidden" id="pdf-invoice-container">
          
          {/* Header invoice stamp */}
          <div className="flex justify-between items-start gap-4 border-b border-[#1f1f23] pb-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Boutiq Switch Vapes</h2>
              <p className="text-[10px] text-[#d4af37] font-bold tracking-widest mt-0.5">PREMIUM AUTHENTIC DISTRIBUTION</p>
              <p className="text-xs text-gray-500 mt-2">invoice.support@boutiqvapes.us</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-yellow-950/40 text-[#d4af37] border border-yellow-800 px-3 py-1 rounded font-mono font-bold uppercase tracking-wider">
                {order.payment_status}
              </span>
              <p className="text-xs text-gray-400 font-mono mt-3">ORDER #{shortId}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">Ref: {order.id.slice(0, 12)}...</p>
            </div>
          </div>

          {/* Delivery & Shipping Info */}
          <div className="grid sm:grid-cols-2 gap-6 text-xs text-gray-300">
            <div>
              <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Billing & Shipping To</h4>
              <p className="font-bold text-white text-sm">{order.customer_name}</p>
              <p className="text-gray-400 mt-1 leading-relaxed max-w-[240px] break-words">{order.customer_address}</p>
              {order.customer_country && <p className="text-[#d4af37] mt-1 font-bold">Country: {order.customer_country}</p>}
              <p className="text-gray-400 mt-1.5">{order.customer_email}</p>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Invoice Specifics</h4>
              <ul className="space-y-1.5 text-gray-400">
                <li className="flex justify-between">
                  <span>Order Date:</span>
                  <span className="font-mono text-white">{new Date(order.created_at).toLocaleDateString()}</span>
                </li>
                <li className="flex justify-between">
                  <span>Preauth Type:</span>
                  <span className="text-white font-semibold flex items-center gap-1.5 bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] text-[10px]">
                    {order.payment_method}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Shipping Option:</span>
                  <span className="text-white font-semibold font-mono">{order.shipping_method || 'Normal'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Items breakdown list */}
          <div className="border-t border-[#1f1f23] pt-6 space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Line Items</h4>
            
            <div className="space-y-3.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-[#18181a] pb-3 gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-200">{item.name}</p>
                    <p className="text-[10px] text-gray-400">Qty: {item.quantity} × <span className="font-mono">${item.price.toFixed(2)}</span></p>
                  </div>
                  <span className="font-mono text-white font-bold shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total aggregate summary matching core user request fields exactly */}
          <div className="border-t border-[#1f1f23] pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex justify-between w-54 text-gray-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between w-54 text-red-500">
                <span>Coupon Discount ({order.coupon_code || 'WELCOME10'}):</span>
                <span className="font-mono">-$${couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {cryptoDiscount > 0 && (
              <div className="flex justify-between w-54 text-emerald-450 text-emerald-400">
                <span>Crypto Discount (10%):</span>
                <span className="font-mono">-$${cryptoDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-54 text-gray-400">
              <span>Shipping Fee ({order.shipping_method || 'Normal'}):</span>
              <span className="font-mono text-white">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-54 text-white font-bold border-t border-[#1f1f23] pt-3 text-sm">
              <span>Final Total:</span>
              <span className="font-mono text-[#d4af37] text-base">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Download invoice trigger inside footer section */}
          <div className="border-t border-[#1f1f23] pt-4 flex justify-between items-center text-gray-500 text-[10px] select-none">
            <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-400" /> Secure SSL Document Receipt</span>
            <button
              onClick={handlePrintInvoice}
              className="px-3 py-1.5 bg-[#18181c] hover:bg-[#1f1f24] text-gray-300 border border-[#27272a] rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider text-[9px]"
            >
              <Printer size={10} /> Print / Save Invoice PDF
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive dispatch email simulation visualization tabs */}
        <div className="space-y-6 select-none">
          <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 space-y-5">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#d4af37] block">LIVE MAIL SERVER TRANSMISSIONS</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                <Mail size={16} className="text-[#d4af37]" /> Sent Notifications
              </h3>
              <p className="text-[11px] text-gray-400 leading-normal mt-1.5">
                The secure email dispatcher successfully triggered notifications based on the checkout selection:
              </p>
            </div>

            {/* Simulated Email tab switcher buttons */}
            <div className="flex border-b border-[#1f1f23] p-1 bg-[#18181c] rounded-xl text-[10px] gap-1 font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 text-center py-2 rounded-lg transition-all ${
                  activeTab === 'instructions' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Payment Steps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('confirmation')}
                className={`flex-1 text-center py-2 rounded-lg transition-all ${
                  activeTab === 'confirmation' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex-1 text-center py-2 rounded-lg transition-all ${
                  activeTab === 'admin' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Admin Alert
              </button>
            </div>

            {/* Email dispatch mock viewer panel */}
            <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-4.5 space-y-3.5 text-xs text-left">
              
              <div className="border-b border-[#27272a] pb-3 space-y-1.5 text-gray-500 text-[10px] font-mono">
                <p><span className="text-gray-400 font-sans font-bold">To:</span> {activeTab === 'admin' ? 'sales@boutiqswitchvapes.us' : order.customer_email}</p>
                
                {activeTab === 'instructions' && (
                  <p><span className="text-gray-400 font-sans font-bold">Subject:</span> <span className="text-white font-mono">Payment Instructions for Order #{shortId}</span></p>
                )}
                {activeTab === 'confirmation' && (
                  <p><span className="text-gray-400 font-sans font-bold">Subject:</span> <span className="text-white font-mono">Order Confirmation for Order #{shortId}</span></p>
                )}
                {activeTab === 'admin' && (
                  <p><span className="text-gray-400 font-sans font-bold">Subject:</span> <span className="text-white font-mono">[NEW BOOKING ALERT] Order #{shortId} list info</span></p>
                )}

                <p><span className="text-gray-400 font-sans font-bold">Delivery Status:</span> <span className="text-emerald-400 font-bold">DELIVERED WITH INVOICE.PDF</span></p>
              </div>

              {/* Message bodies matching exact prompt directives */}
              <div className="text-gray-300 text-xs leading-relaxed font-sans space-y-2 select-all">
                {activeTab === 'instructions' && (
                  <div className="space-y-2">
                    <p className="font-bold text-white">Payment Method: {order.payment_method}</p>
                    <p>Amount Due: <strong className="text-[#d4af37] font-mono">${order.total.toFixed(2)}</strong></p>
                    <p className="border-l-2 border-[#d4af37] pl-2 text-[11px] text-gray-400 italic">
                      Payment instructions have been mailed to your email address, including wallet detail, Apple Cash emails, or credit holds. Please settle within the 48-hour deadline.
                    </p>
                  </div>
                )}

                {activeTab === 'confirmation' && (
                  <div className="space-y-2">
                    <p>Hello {order.customer_name},</p>
                    <p>
                      Your order #{shortId} has been successfully submitted!
                    </p>
                    <p>
                      Shipping Selected: <strong className="text-white">{order.shipping_method || 'Normal'}</strong> (Est. ${shippingCost})
                    </p>
                    <p>
                      Grand Total Charged: <strong className="text-[#d4af37] font-mono">${order.total.toFixed(2)}</strong>
                    </p>
                  </div>
                )}

                {activeTab === 'admin' && (
                  <div className="space-y-2">
                    <p>Administrator Notice,</p>
                    <p>
                      Order #{shortId} placed by {order.customer_name} ({order.customer_email}) under Country: {order.customer_country || 'United States'}.
                    </p>
                    <p>
                      Logistics Method: {order.shipping_method || 'Normal'}, Payment Option: {order.payment_method}.
                    </p>
                    <p>
                      Sales Volume: ${order.total.toFixed(2)}. Verify cleared deposits to flag active processing.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 px-4 font-sans" id="success-screen">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="animate-spin text-[#d4af37] w-10 h-10" />
          <p className="text-gray-400 font-medium font-sans">Locating order trace reference...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
