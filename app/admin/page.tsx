'use client';

import { useEffect, useState } from 'react';
import { 
  Users, ShoppingCart, DollarSign, Package, AlertTriangle, 
  Search, Mail, Phone, MapPin, Calendar, CreditCard, Tag, 
  Check, RefreshCw, Layers, ShieldCheck, ChevronDown, Play 
} from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_code: string | null;
  payment_method: string;
  order_total: number;
  order_status: string;
  created_at: string;
  items: OrderItem[];
}

interface AbandonedCart {
  id: string;
  customer_email: string;
  customer_name: string | null;
  cart_data: string;
  last_activity: string;
  email_1h_sent: number;
  email_24h_sent: number;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'orders' | 'abandoned'>('orders');

  // Triggering actions states
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isTriggeringCron, setIsTriggeringCron] = useState(false);
  const [cronReport, setCronReport] = useState<string | null>(null);

  // 1. Load Orders & Abandoned Carts
  const reloadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ordersRes = await fetch('/api/admin/orders');
      const ordersData = await ordersRes.json();
      
      const cartsRes = await fetch('/api/admin/abandoned-carts');
      const cartsData = await cartsRes.json();

      if (ordersRes.ok && ordersData.success) {
        setOrders(ordersData.orders);
      } else {
        setError(ordersData.error || 'Failed to sync orders.');
      }

      if (cartsRes.ok && cartsData.success) {
        setAbandonedCarts(cartsData.carts);
      }
    } catch (err) {
      setError('Network communication failed with admin metrics endpoints.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      // Yield to next event execution cycle to satisfy React hook directives
      await new Promise(resolve => setTimeout(resolve, 0));
      if (active) {
        reloadData();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // 2. Change dynamic status update
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Update local state instantly and smoothly
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
      } else {
        alert(data.error || 'Failed to modify order status.');
      }
    } catch (err) {
      alert('Error updating status on server.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // 3. Manually call cart recovery webhook scan
  const handleTriggerCron = async () => {
    setIsTriggeringCron(true);
    setCronReport(null);
    try {
      const res = await fetch('/api/cron/abandoned-carts');
      const data = await res.json();
      if (res.ok && data.success) {
        setCronReport(`Cron executed successfully: sent ${data.summary.processed_1h_count} (1h) and ${data.summary.processed_24h_count} (24h) reminders.`);
        reloadData(); // refresh stats
      } else {
        setCronReport('Failed running automatic routine scan.');
      }
    } catch (err) {
      setCronReport('Error executing background recovery worker.');
    } finally {
      setIsTriggeringCron(false);
    }
  };

  // Calculate Metrics aggregates
  const completedOrders = orders.filter(o => o.order_status !== 'Cancelled');
  const revenueTotal = completedOrders.reduce((sum, o) => sum + o.order_total, 0);
  const pendingPaymentsCount = orders.filter(o => o.order_status === 'Pending Payment').length;
  const processedOrdersCount = orders.length;
  const totalAbandonedCount = abandonedCarts.length;

  // Search/Filters process
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_phone && order.customer_phone.includes(searchQuery)) ||
      order.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatusFilter === 'All' || order.order_status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-8 bg-main-bg min-h-screen" id="admin-viewport">
      
      {/* Header and Sync Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-soft pb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8" /> Boutiq Admin Console
          </h1>
          <p className="text-sm text-text-secondary">Track live customer orders, modify shipping statuses, and monitor cart recoveries.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={reloadData} 
            disabled={isLoading}
            className="bg-secondary-bg hover:bg-border-soft border border-border-soft text-text-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Metrics
          </button>
          
          <button
            onClick={handleTriggerCron}
            disabled={isTriggeringCron}
            className="bg-primary hover:bg-accent text-main-bg px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-primary/10"
          >
            {isTriggeringCron ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Trigger Cart Recoveries
          </button>
        </div>
      </div>

      {cronReport && (
        <div className="bg-success/5 border border-success/30 text-success rounded-2xl p-4 text-xs font-medium flex justify-between items-center pr-6">
          <span>{cronReport}</span>
          <button type="button" onClick={() => setCronReport(null)} className="text-text-secondary hover:text-text-primary font-mono text-[10px]">Close</button>
        </div>
      )}

      {/* Aggregate Statistics overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-ribbon">
        <div className="bg-secondary-bg/30 border border-border-soft p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary font-medium">Lifetime Revenue</span>
            <DollarSign className="text-primary w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono">${revenueTotal.toFixed(2)}</p>
          <span className="text-[10px] text-text-secondary block">Excluding Cancelled invoices</span>
        </div>

        <div className="bg-secondary-bg/30 border border-border-soft p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary font-medium">Lifetime Volumes</span>
            <Package className="text-primary w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono">{processedOrdersCount}</p>
          <span className="text-[10px] text-text-secondary block">Orders saves inside SQLite/D1</span>
        </div>

        <div className="bg-secondary-bg/30 border border-border-soft p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary font-medium">Pending Payments</span>
            <AlertTriangle className="text-orange w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-bold text-orange font-mono">{pendingPaymentsCount}</p>
          <span className="text-[10px] text-text-secondary block">Waiting manual verification code</span>
        </div>

        <div className="bg-secondary-bg/30 border border-border-soft p-5 rounded-2xl space-y-2 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary font-medium">Abandoned Carts</span>
            <Users className="text-primary w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono">{totalAbandonedCount}</p>
          <span className="text-[10px] text-text-secondary block">With active capture details</span>
        </div>
      </div>

      {/* Tabs configuration */}
      <div className="flex border-b border-border-soft">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Orders Log ({filteredOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('abandoned')}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'abandoned'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Cart Abandonment Monitor ({abandonedCarts.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-xs font-semibold">
          Error: {error}
        </div>
      )}

      {/* Tab content 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Query Filter and Selection Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder="Search by order #, visitor name, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border-soft bg-secondary-bg/25 rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary focus:bg-main-bg transition-all"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 select-none">
              {['All', 'Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    selectedStatusFilter === status
                      ? 'bg-text-primary text-main-bg'
                      : 'bg-secondary-bg text-text-secondary border border-border-soft hover:bg-border-soft/35'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Log list viewer */}
          {isLoading ? (
            <div className="text-center py-20 text-xs text-text-secondary space-y-2">
              <RefreshCw className="animate-spin mx-auto w-6 h-6 text-primary" />
              <p>Scanning relational database logs...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border-soft rounded-3xl space-y-3">
              <ShoppingCart size={40} className="mx-auto text-text-secondary opacity-45" />
              <div className="space-y-1">
                <p className="font-heading font-medium text-text-primary">No orders found</p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">No invoices match your search values or status filters inside SQLite/D1 database logs.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className="border border-border-soft bg-secondary-bg/10 rounded-3xl overflow-hidden shadow-sm hover:border-text-secondary/25 transition-all text-xs"
                >
                  {/* Order Top Summary Line */}
                  <div className="p-5 bg-secondary-bg/20 border-b border-border-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono font-bold text-sm text-text-primary">{order.order_number}</span>
                      <span className="font-mono font-bold uppercase tracking-wider text-[10px] bg-border-soft px-2.5 py-0.5 rounded text-text-primary">
                        {order.payment_method.replace('_', ' ')}
                      </span>
                      {order.coupon_code && (
                        <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Tag size={10} /> {order.coupon_code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-text-secondary block font-sans">Total Collected</span>
                        <strong className="text-base font-bold text-text-primary font-mono">${order.order_total.toFixed(2)}</strong>
                      </div>

                      {/* Status Dropdown selector */}
                      <div className="relative">
                        <select
                          disabled={updatingOrderId === order.id}
                          className={`appearance-none pr-8 pl-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all outline-none ${
                            order.order_status === 'Delivered'
                              ? 'bg-success/10 border-success/30 text-success'
                              : order.order_status === 'Shipped'
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : order.order_status === 'Processing'
                                  ? 'bg-secondary text-main-bg border-transparent'
                                  : order.order_status === 'Cancelled'
                                    ? 'bg-red-50 border-red-200 text-red-500'
                                    : 'bg-orange/10 border-orange/40 text-orange'
                          }`}
                          value={order.order_status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="Pending Payment">Pending Payment</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-current pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Order Mid Info: Customer + Items */}
                  <div className="p-6 grid md:grid-cols-[1fr_300px] gap-8">
                    {/* Customer Profile & Destination */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-heading font-medium text-text-primary text-[11px] uppercase tracking-wider mb-2">Customer Demographics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          <p className="flex items-center gap-2 text-text-secondary">
                            <Users size={14} className="shrink-0 text-text-secondary/80 focus:text-primary" /> 
                            <strong className="text-text-primary font-medium">{order.customer_name}</strong>
                          </p>
                          <p className="flex items-center gap-2 text-text-secondary select-all">
                            <Mail size={14} className="shrink-0 text-text-secondary/80" /> 
                            <span>{order.customer_email}</span>
                          </p>
                          <p className="flex items-center gap-2 text-text-secondary select-all">
                            <Phone size={14} className="shrink-0 text-text-secondary/80" /> 
                            <span>{order.customer_phone || 'None provided'}</span>
                          </p>
                          <p className="flex items-center gap-2 text-text-secondary">
                            <Calendar size={14} className="shrink-0 text-text-secondary/80" /> 
                            <span>{new Date(order.created_at).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-border-soft/60 pt-3">
                        <h4 className="font-heading font-medium text-text-primary text-[11px] uppercase tracking-wider mb-2">Shipping Destination</h4>
                        <p className="flex items-center gap-2 text-text-secondary">
                          <MapPin size={14} className="shrink-0 text-primary" />
                          <span>{order.shipping_address}, {order.city}, {order.state} - {order.zip_code} ({order.country})</span>
                        </p>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="space-y-3 bg-secondary-bg/20 p-4 rounded-2xl border border-border-soft/70">
                      <h4 className="font-heading font-semibold text-text-primary text-[11px] uppercase tracking-wide">Products Invoiced</h4>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {order.items && order.items.map(item => (
                          <div key={item.id} className="flex justify-between items-start gap-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-text-primary leading-tight block">{item.product_name}</span>
                              <span className="text-[10px] text-text-secondary block">Qty {item.quantity} × ${Number(item.price).toFixed(2)}</span>
                            </div>
                            <span className="font-mono font-bold text-text-primary text-right">${(item.quantity * item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border-soft/85 pt-2 space-y-1 font-mono text-[10px] text-text-secondary text-right">
                        <p>Subtotal: ${(Number(order.subtotal)).toFixed(2)}</p>
                        {order.discount_amount > 0 && <p className="text-rose-500">Discount: -${(Number(order.discount_amount)).toFixed(2)}</p>}
                        <p>Shipping: ${(Number(order.shipping_cost)).toFixed(2)}</p>
                        <p className="font-bold text-text-primary uppercase text-xs pt-1 border-t border-dashed border-border-soft mt-1">Invoice: ${order.order_total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab content 2: Abandoned Carts */}
      {activeTab === 'abandoned' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-primary/5 border border-primary/20 p-5 rounded-3xl">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-text-primary text-base">Automatic Abandoned Cart Reminders</h3>
              <p className="xs:text-xs text-[10px] text-text-secondary max-w-xl">
                Our background scheduler scans for users who write their emails but disconnect before confirming. We send friendly checkout reminders after 1 hour (10% code welcome) and 24 hours (expiration alert).
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-xs text-text-secondary">
              <RefreshCw className="animate-spin mx-auto w-6 h-6 text-primary mb-2" />
              Scanning active checkout sessions...
            </div>
          ) : abandonedCarts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border border-border-soft rounded-3xl space-y-3">
              <Users size={40} className="mx-auto text-text-secondary opacity-40 animate-pulse" />
              <div className="space-y-1">
                <p className="font-heading font-medium text-text-primary">No abandoned carts currently tracked</p>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">Either every customer is checked out successfully or no visitor details have been entered on checkout fields yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {abandonedCarts.map(cart => {
                let parsedItems: any[] = [];
                try {
                  parsedItems = JSON.parse(cart.cart_data);
                } catch (e) {
                  // ignored
                }

                return (
                  <div 
                    key={cart.id} 
                    className="border border-border-soft bg-secondary-bg/10 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-all text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Cart top details */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 select-all">
                          <h4 className="font-bold text-text-primary text-sm leading-tight">{cart.customer_name || 'Guest User'}</h4>
                          <span className="text-xs text-text-secondary block flex items-center gap-1">
                            <Mail size={12} /> {cart.customer_email}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] bg-border-soft px-2 py-0.5 rounded text-text-secondary whitespace-nowrap block">
                          ID: {cart.id.slice(-6)}
                        </span>
                      </div>

                      {/* Items abandoned */}
                      <div className="bg-secondary-bg/20 border border-border-soft/60 p-3 rounded-xl">
                        <h5 className="font-bold uppercase text-[9px] tracking-wide text-text-secondary mb-2">Saved Cart Products</h5>
                        <ul className="space-y-1.5">
                          {parsedItems.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-[11px] leading-tight">
                              <span className="font-medium text-text-primary line-clamp-1">{item.name || item.product_name} <span className="font-mono text-[9px] text-text-secondary">({item.variant})</span></span>
                              <strong className="text-text-primary shrink-0 ml-4">× {item.quantity}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Status recovery indicators */}
                    <div className="border-t border-border-soft/60 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        {/* 1 Hour Email indicator */}
                        <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          cart.email_1h_sent === 1 
                            ? 'bg-success/15 text-success' 
                            : 'bg-orange/10 text-orange'
                        }`}>
                          {cart.email_1h_sent === 1 ? <Check size={10} /> : '○'} 1h Reminder
                        </span>

                        {/* 24 Hour Email indicator */}
                        <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                          cart.email_24h_sent === 1 
                            ? 'bg-success/15 text-success' 
                            : 'bg-orange/10 text-orange'
                        }`}>
                          {cart.email_24h_sent === 1 ? <Check size={10} /> : '○'} 24h Reminder
                        </span>
                      </div>

                      <span className="text-[10px] text-text-secondary">
                        Active: {new Date(cart.last_activity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
