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
  AlertCircle
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
  total: number;
  payment_method: string;
  payment_status: string;
  card_last4: string;
  created_at: string;
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
      // Defer loading update to avoid react-hooks/set-state-in-effect issues
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

  // Handle high quality invoice print action
  const handlePrintInvoice = () => {
    window.print();
  };

  // Helper to slice ID for short order number displays
  const getShortId = (id: string) => {
    if (!id) return 'N/A';
    return id.substring(0, 8).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <RefreshCw className="animate-spin text-[#d4af37] w-10 h-10" />
        <p className="text-gray-400 font-medium text-sm">Compiling dispatch details and generating invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="bg-red-950/20 border border-red-900 rounded-3xl p-6 text-red-400 text-sm">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
          <p className="font-bold">Order Details Unavailable</p>
          <p className="text-xs text-gray-450 mt-1">{error || 'Order record is not found in the D1 store.'}</p>
        </div>
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#d4af37] hover:underline font-bold">
          <ArrowRight className="rotate-180" size={14} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const shortId = getShortId(order.id);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-16 font-sans">
      
      {/* 1. Header Confirmation Banner */}
      <div className="text-center space-y-4 pt-10 select-none">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3 select-none">
          <CheckCircle size={44} className="text-emerald-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans">Order Submitted!</h1>
          <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">
            Thank you for shopping with us. Your checkout transaction holds a status of <strong className="text-yellow-400">{order.payment_status}</strong>.
          </p>
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
          <div className="grid sm:grid-cols-2 gap-6 text-xs">
            <div>
              <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Billing & Shipping To</h4>
              <p className="font-bold text-white text-sm">{order.customer_name}</p>
              <p className="text-gray-400 mt-1 leading-relaxed max-w-[240px] break-words">{order.customer_address}</p>
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
                  <span>Payment Gateway:</span>
                  <span className="text-white font-semibold flex items-center gap-1.5 bg-[#18181c] px-1.5 py-0.5 rounded border border-[#27272a] text-[10px]">
                    <span className="flex space-x-[-8px]">
                      <span className="w-3 h-3 rounded-full bg-[#eb001b]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#ff5f00]"></span>
                    </span>
                    {order.payment_method}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Card Used:</span>
                  <span className="font-mono text-white">Mastercard (•••• {order.card_last4 || 'N/A'})</span>
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

          {/* Total aggregate summary */}
          <div className="border-t border-[#1f1f23] pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex justify-between w-48 text-gray-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between w-48 text-gray-400">
              <span>Delivery Delivery:</span>
              <span className="text-emerald-400 font-bold">FREE</span>
            </div>
            <div className="flex justify-between w-48 text-white font-bold border-t border-[#1f1f23] pt-3 text-sm">
              <span>Total Invoice Amount:</span>
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
                The secure email dispatcher successfully triggered notifications based on the Mastercard checkout rules:
              </p>
            </div>

            {/* Simulated Email tab switcher buttons */}
            <div className="flex border-b border-[#1f1f23] p-1 bg-[#18181c] rounded-xl text-[10px] gap-1 font-semibold">
              <button
                onClick={() => setActiveTab('instructions')}
                className={`flex-1 text-center py-2 rounded-lg transition-all ${
                  activeTab === 'instructions' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Payment Steps
              </button>
              <button
                onClick={() => setActiveTab('confirmation')}
                className={`flex-1 text-center py-2 rounded-lg transition-all ${
                  activeTab === 'confirmation' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Confirmation
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 text-center py-2 rounded-lg transition-all ${
                  activeTab === 'admin' ? 'bg-[#d4af37] text-black font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Admin Notice
              </button>
            </div>

            {/* Email dispatch mock viewer panel */}
            <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-4.5 space-y-3.5 text-xs text-left">
              
              {/* Header metrics */}
              <div className="border-b border-[#27272a] pb-3 space-y-1.5 text-gray-500 text-[10px] font-mono">
                <p><span className="text-gray-400 font-sans font-bold">To:</span> {activeTab === 'admin' ? 'admin@boutiqvapes.us' : order.customer_email}</p>
                
                {/* Dynamically match the requested email formatting */}
                {activeTab === 'instructions' && (
                  <p><span className="text-gray-400 font-sans font-bold">Subject:</span> <span className="text-white font-mono">Payment Instructions for Order #{shortId}</span></p>
                )}
                {activeTab === 'confirmation' && (
                  <p><span className="text-gray-400 font-sans font-bold">Subject:</span> <span className="text-white font-mono">Order Confirmation for Order #{shortId}</span></p>
                )}
                {activeTab === 'admin' && (
                  <p><span className="text-gray-400 font-sans font-bold">Subject:</span> <span className="text-white font-mono">Admin Notification: New Mastercard Order #{shortId}</span></p>
                )}

                <p><span className="text-gray-400 font-sans font-bold">Header Status:</span> <span className="text-emerald-400">DISPATCHED SECURELY</span></p>
              </div>

              {/* Message bodies matching exact prompt directives */}
              <div className="text-gray-300 text-xs leading-relaxed font-sans space-y-2 select-all">
                {activeTab === 'instructions' && (
                  <p>
                    &quot;Thank you for your order. Mastercard payment instructions have been sent for Order #{shortId}. Please follow the instructions provided to complete payment. Your order will remain in Pending Payment status until payment has been successfully received and verified.&quot;
                  </p>
                )}

                {activeTab === 'confirmation' && (
                  <div className="space-y-2">
                    <p>Dear {order.customer_name},</p>
                    <p>
                      This email confirms receipt of Order #{shortId}. Your payment method was registered as <strong className="text-white font-mono">Mastercard</strong> (Ending in •••• {order.card_last4}).
                    </p>
                    <p>
                      Under the active Mastercard guidelines, your transaction details are held in verification status: <strong className="text-yellow-400">{order.payment_status}</strong>.
                    </p>
                  </div>
                )}

                {activeTab === 'admin' && (
                  <div className="space-y-2">
                    <p>Administrator,</p>
                    <p>
                      A new order #{shortId} has been submitted on the check out system with <strong className="text-white">Mastercard</strong>.
                    </p>
                    <p>
                      Details: Customer {order.customer_name} ({order.customer_email}), Address: {order.customer_address}. Total Sales Volume: ${order.total.toFixed(2)}.
                    </p>
                    <p>
                      Action Required: Verify the receipt of funds and log into the admin dashboard area to process status updates.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Quick link buttons to admin dashboard & shop */}
          <div className="space-y-3 pt-2">
            <Link 
              href="/admin" 
              className="w-full bg-[#18181c] hover:bg-[#1f1f24] text-[#d4af37] border border-[#27272a] py-3.5 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              Access Admin Dashboard <ChevronRight size={14} />
            </Link>
            
            <Link 
              href="/products" 
              className="w-full bg-[#d4af37] hover:bg-[#c5a030] text-black py-4 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#d4af37]/15"
            >
              Back to Catalog <ArrowRight size={15} />
            </Link>
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
