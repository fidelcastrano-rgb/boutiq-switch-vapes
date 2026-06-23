'use client';

import { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  Mail, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard,
  User,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ListFilter,
  Globe,
  Tag,
  Coins,
  Truck
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderRecord {
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
  items: OrderItem[] | string;
}

interface DispatchLog {
  id: string;
  orderId: string;
  customerEmail: string;
  timestamp: string;
  subject: string;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [mastercardEnabled, setMastercardEnabled] = useState(true);
  const [emailLogs, setEmailLogs] = useState<DispatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local interaction triggers
  const [isMutatingSettings, setIsMutatingSettings] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [activeStatusChangingId, setActiveStatusChangingId] = useState<string | null>(null);
  const [activeResendingId, setActiveResendingId] = useState<string | null>(null);

  // Retrieve admin order sets and variables
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setMastercardEnabled(data.mastercard_payments_enabled !== false);
        setEmailLogs(data.email_dispatches || []);
      } else {
        setError(data.error || 'Server rejected retrieving order sets.');
      }
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      setError('Failed to communicate with DB API endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 1. Toggle Mastercard restrictions globally
  const handleToggleGateway = async () => {
    setIsMutatingSettings(true);
    setActionSuccessMsg(null);
    const targetStatus = !mastercardEnabled;

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-settings',
          mastercard_payments_enabled: targetStatus
        })
      });
      const data = await res.json();

      if (data.success) {
        setMastercardEnabled(targetStatus);
        setActionSuccessMsg(`Mastercard payment requirements configured as: ${targetStatus ? 'Enabled' : 'Disabled'}.`);
      } else {
        setError(data.error || 'Could not update gateway toggle settings.');
      }
    } catch (err: any) {
      console.error('Error toggling payment settings:', err);
      setError('Communication exception writing setup alterations.');
    } finally {
      setIsMutatingSettings(false);
    }
  };

  // 2. Change individual Mastercard order status
  const handleUpdateStatus = async (orderId: string, status: string) => {
    setActiveStatusChangingId(orderId);
    setActionSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          orderId,
          status
        })
      });
      const data = await res.json();

      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: status } : o));
        setActionSuccessMsg(`Order ${orderId.substring(0, 8).toUpperCase()} status successfully marked as ${status}!`);
      } else {
        setError(data.error || 'Error mutating order status references.');
      }
    } catch (err: any) {
      console.error('Error updating order state:', err);
      setError('Network communication crashed during state change.');
    } finally {
      setActiveStatusChangingId(null);
    }
  };

  // 3. Trigger manual email payment instruction resends
  const handleResendInstructions = async (orderId: string) => {
    setActiveResendingId(orderId);
    setActionSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend-instructions',
          orderId
        })
      });
      const data = await res.json();

      if (data.success) {
        setActionSuccessMsg(`Unified checkout notification successfully resubmitted to ${data.dispatch.customerEmail}!`);
        // Append log locally
        if (data.dispatch) {
          setEmailLogs(prev => [data.dispatch, ...prev]);
        }
      } else {
        setError(data.error || 'Triggering resend instructions failed.');
      }
    } catch (err: any) {
      console.error('Instructions dispatch exception:', err);
      setError('Network transmission error triggering dispatch instructions.');
    } finally {
      setActiveResendingId(null);
    }
  };

  // Calculations for stats summary cards
  const totalSalesVolume = orders
    .filter(o => o.payment_status === 'Paid')
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  const pendingMastercardVolume = orders
    .filter(o => o.payment_status === 'Pending Payment')
    .reduce((acc, o) => acc + Number(o.total || 0), 0);

  const getParsedItems = (itemField: OrderItem[] | string): OrderItem[] => {
    if (typeof itemField === 'string') {
      try {
        return JSON.parse(itemField);
      } catch (e) {
        return [];
      }
    }
    return itemField || [];
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 font-sans" id="admin-viewport">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Navigation link */}
        <div className="mb-6 flex justify-between items-center select-none">
          <Link href="/products" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="rotate-180" size={12} /> Return to Store Catalog
          </Link>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-1.5 bg-[#121214] border border-[#1f1f23] hover:bg-[#18181c] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} /> Reload Feeds
          </button>
        </div>

        {/* Dashboard Title & Quick Toggle Panel */}
        <div className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-[#d4af37] tracking-widest uppercase">Administrative Headquarters</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans mt-1">Order Log & Logistics Board</h1>
            <p className="text-gray-400 text-xs mt-1">Manage global checkout restrictions, coupon usage, shipping methods, customer country profiles, and invoice logs.</p>
          </div>

          {/* ACTIVE MASTERCARD ENABLEMENT TOGGLE BLOCK */}
          <div className="bg-[#18181c] border border-[#27272a] rounded-2xl p-4 flex items-center justify-between gap-6 min-w-[280px]">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gateway status</p>
              <p className="text-xs text-white font-bold mt-1">Mastercard Authorization</p>
            </div>
            
            <button
              onClick={handleToggleGateway}
              disabled={isMutatingSettings}
              className="outline-none transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-40"
              title="Toggle checkout active state"
            >
              {mastercardEnabled ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="text-xs font-bold font-mono">ENFORCED</span>
                  <ToggleRight size={38} className="text-emerald-400 stroke-[1.5]" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <span className="text-xs font-bold font-mono">BYPASSED</span>
                  <ToggleLeft size={38} className="text-gray-500 stroke-[1.5]" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Alert Notifications banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/20 border border-emerald-900 text-emerald-400 rounded-2xl p-4 text-xs font-bold mb-8 flex items-center gap-2.5 animate-bounce-short">
            <CheckCircle size={16} className="shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/20 border border-red-900 text-red-400 text-xs font-bold mb-8 rounded-2xl p-4 flex items-center gap-2.5">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STATS BENTO METRIC GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-left select-none">
          
          <div className="bg-[#121214] border border-[#1f1f23] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Volume (Paid)</span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-white">${totalSalesVolume.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">Total cleared sales volume</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#1f1f23] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">Unverified Volume (Pending)</span>
              <Clock size={16} className="text-yellow-400" />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-white">${pendingMastercardVolume.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500">Awaiting payment instruction triggers</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#1f1f23] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">Database Total Orders</span>
              <ShoppingBag size={16} className="text-[#d4af37]" />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-white">{orders.length}</p>
              <p className="text-[10px] text-gray-500">Total checkouts in persistent storage</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#1f1f23] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">System Filter Status</span>
              <span className={`w-2.5 h-2.5 rounded-full ${mastercardEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-white">{mastercardEnabled ? 'MC GATEWAY STRICT' : 'NORMAL (ALL GATEWAYS)'}</p>
              <p className="text-[10px] text-gray-500">Global CC validations flag state</p>
            </div>
          </div>

        </div>

        {/* Grid layout: orders list feed / email logs sidebar */}
        <div className="grid lg:grid-cols-[1fr_390px] gap-8 items-start">
          
          {/* ORDERS LOG FEED */}
          <section className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-[#1f1f23] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ListFilter size={18} className="text-[#d4af37]" /> Unified Orders Registry ({orders.length})
              </h2>
              <span className="text-[10px] font-mono text-gray-500 uppercase">D1 SQLite Store</span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 space-y-3">
                <RefreshCw className="animate-spin mx-auto w-8 h-8 text-[#d4af37]" />
                <p className="text-sm">Retrieving customer order sheets...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center text-gray-400 space-y-3 bg-[#18181c]/50 rounded-2xl border border-dashed border-[#27272a] p-6">
                <ShoppingBag size={34} className="mx-auto text-gray-600" />
                <p className="text-sm font-semibold">No orders logged yet.</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">Place a secure checkout to populate the administrative ledger.</p>
                <Link href="/products" className="inline-block mt-2 text-xs bg-[#d4af37] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#c5a030] transition-colors">
                  Submit test checkout
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => {
                  const itemsList = getParsedItems(ord.items);
                  const shortId = ord.id.substring(0, 8).toUpperCase();
                  
                  // Financial breakdowns
                  const productSubtotal = itemsList.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0);
                  const couponDiscount = Number(ord.discount_amount || 0);
                  const cryptoDiscount = Number(ord.crypto_discount || 0);
                  
                  // Calculate shipping fee stored in record
                  let shippingCost = 20;
                  const methodUpper = (ord.shipping_method || 'Normal').toUpperCase();
                  if (methodUpper.includes('OVERNIGHT')) shippingCost = 60;
                  else if (methodUpper.includes('EXPRESS')) shippingCost = 35;
                  else if (methodUpper.includes('NORMAL')) shippingCost = 20;

                  return (
                    <div key={ord.id} className="bg-[#18181c] border border-[#27272a] rounded-2xl p-5 space-y-4 hover:border-[#38383c] transition-colors" id={`order-card-${ord.id}`}>
                      
                      {/* Order general header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272a] pb-3 gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-mono text-sm font-black text-white">ORDER #{shortId}</h4>
                            <span className="text-[9px] bg-sky-950 text-sky-400 border border-sky-900 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Globe size={11} /> {ord.customer_country || 'United States'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">({new Date(ord.created_at).toLocaleDateString()})</span>
                          </div>
                          
                          {/* Payment badge and method details */}
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-sans mt-0.5">
                            <span className="font-bold flex items-center gap-1.5 bg-[#27272a] px-2 py-0.5 rounded text-white text-[9px] uppercase border border-zinc-700">
                              <CreditCard size={11} className="text-[#d4af37]" />
                              {ord.payment_method}
                            </span>
                            {ord.card_last4 && <span>(•••• {ord.card_last4})</span>}
                          </div>
                        </div>

                        {/* STATUS SELECTOR DROPDOWN */}
                        <div className="flex items-center gap-2 text-xs self-start sm:self-center">
                          <label className="text-gray-400 font-medium font-sans">Status:</label>
                          <select
                            value={ord.payment_status}
                            disabled={activeStatusChangingId === ord.id}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                            className={`p-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer focus:ring-1 focus:ring-[#d4af37] transition-all bg-[#121214] ${
                              ord.payment_status === 'Paid' 
                                ? 'text-emerald-400 border-emerald-900/60' 
                                : ord.payment_status === 'Failed' || ord.payment_status === 'Cancelled'
                                ? 'text-red-400 border-red-950'
                                : 'text-yellow-450 text-yellow-400 border-yellow-900/60'
                            }`}
                          >
                            <option value="Pending Payment" className="text-yellow-400 font-bold">Pending Payment</option>
                            <option value="Paid" className="text-emerald-400 font-bold">Paid (Cleared)</option>
                            <option value="Failed" className="text-red-400 font-bold">Failed</option>
                            <option value="Refunded" className="text-gray-400 font-bold">Refunded</option>
                            <option value="Cancelled" className="text-gray-400 font-bold">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer contact info */}
                      <div className="grid sm:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1 text-gray-300">
                          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Customer Profile</p>
                          <p className="text-white font-bold flex items-center gap-1.5"><User size={12} className="text-[#d4af37]" /> {ord.customer_name}</p>
                          <p className="text-gray-400 font-mono text-[11px]">{ord.customer_email}</p>
                        </div>
                        <div className="space-y-1 text-gray-300">
                          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Logistics Destination Address</p>
                          <p className="text-gray-400 leading-normal max-w-sm line-clamp-2">{ord.customer_address}</p>
                        </div>
                      </div>

                      {/* Items details / Logistics breakdown table representation */}
                      <div className="bg-[#121214] border border-[#1f1f23] rounded-xl p-4.5 space-y-3">
                        <div className="flex justify-between items-center border-b border-[#27272a] pb-2">
                          <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Purchased Items Details</span>
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <Truck size={12} /> {ord.shipping_method || 'Normal'} Shipping
                          </span>
                        </div>

                        <div className="space-y-2">
                          {itemsList.map((itm, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
                              <span className="font-semibold line-clamp-1">{itm.name} <span className="text-[10px] text-gray-500">×{itm.quantity}</span></span>
                              <span className="font-mono text-white">${(itm.price * itm.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Financial Ledger Columns matching checkout rules */}
                        <div className="border-t border-[#27272a]/70 pt-2.5 space-y-1.5 text-xs">
                          <div className="flex justify-between text-gray-500">
                            <span>Product Subtotal:</span>
                            <span className="font-mono">${productSubtotal.toFixed(2)}</span>
                          </div>
                          
                          {couponDiscount > 0 && (
                            <div className="flex justify-between text-red-400 text-[11px]">
                              <span className="flex items-center gap-1"><Tag size={11} /> Coupon Applied ({ord.coupon_code || 'WELCOME10'}):</span>
                              <span className="font-mono">-${couponDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          {cryptoDiscount > 0 && (
                            <div className="flex justify-between text-emerald-400 text-[11px]">
                              <span className="flex items-center gap-1"><Coins size={11} /> Cryptocurrency Incentive (10%):</span>
                              <span className="font-mono">-${cryptoDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-gray-500">
                            <span>Logistics Fee ({ord.shipping_method || 'Normal'}):</span>
                            <span className="font-mono">${shippingCost.toFixed(2)}</span>
                          </div>

                          <div className="flex justify-between items-center text-white border-t border-[#1f1f23] pt-2 font-bold mt-1">
                            <span>Grand Total Ledger:</span>
                            <span className="font-mono text-[#d4af37] text-sm">${ord.total.toFixed(2)}</span>
                          </div>
                        </div>

                      </div>

                      {/* Administrative triggers actions line */}
                      <div className="flex justify-between items-center border-t border-[#27272a] pt-3 text-[10px] select-none">
                        <span className="text-gray-500 font-sans">Trace: <span className="font-mono">{ord.id}</span></span>
                        
                        <button
                          onClick={() => handleResendInstructions(ord.id)}
                          disabled={activeResendingId === ord.id}
                          className="px-3 py-1.5 bg-[#121214] hover:bg-[#27272a] text-[#d4af37] hover:text-white border border-[#27272a] rounded-lg transition-all flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider text-[9px]"
                        >
                          {activeResendingId === ord.id ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" /> Transmitting...
                            </>
                          ) : (
                            <>
                              <Mail size={11} /> Resend Details & Invoice
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SIMULATED EMAIL NOTIFICATIONS DISPATCH FEED */}
          <aside className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 space-y-6 text-left select-none">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#d4af37] block">VIRTUAL DISPATCH LOGGER</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-1">
                <Mail size={16} className="text-[#d4af37]" /> SMTP Mail Logs Feed
              </h3>
              <p className="text-[11px] text-gray-400 leading-normal mt-1.5 font-sans">
                Real-time SMTP dispatch log showing full-packet invoice transmissions:
              </p>
            </div>

            {emailLogs.length === 0 ? (
              <div className="py-12 text-center text-gray-500 border border-dashed border-[#1f1f23] rounded-2xl p-4 text-xs font-medium font-sans">
                <p>No dispatch tasks logged in database.</p>
                <p className="text-[10px] text-gray-600 mt-1">Place checkouts or trigger Resends from log entries to populate logs.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {emailLogs.map((log) => (
                  <div key={log.id} className="bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs space-y-1.5 animate-fadeIn">
                    <div className="flex justify-between items-center text-[9px] font-mono text-gray-500">
                      <span>Ref Log: {log.id.slice(0, 10).toUpperCase()}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px]"><span className="font-bold text-gray-500">Sent To:</span> {log.customerEmail}</p>
                      <p className="text-white font-bold text-[10px] mt-0.5 leading-snug">{log.subject}</p>
                    </div>
                    <div className="bg-[#09090b] text-[10px] text-gray-400 p-2 rounded-lg border border-[#1d1d21] font-mono leading-relaxed leading-normal">
                      &quot;Full-packet transactional receipt dispatched safely. Attached fully formatted Invoice.pdf invoice document.&quot;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

      </div>
    </div>
  );
}
