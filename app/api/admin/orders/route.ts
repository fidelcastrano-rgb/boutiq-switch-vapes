import { NextRequest, NextResponse } from 'next/server';
import { deliverAllCheckoutAutomation } from '@/lib/email';

// Initialize global tracking structures for sandbox container fallbacks
if (!(globalThis as any).__inMemoryOrdersStore) {
  (globalThis as any).__inMemoryOrdersStore = [];
}
if (!(globalThis as any).__inMemoryAdminSettings) {
  (globalThis as any).__inMemoryAdminSettings = {
    'mastercard_payments_enabled': 'true'
  };
}
if (!(globalThis as any).__inMemoryEmailDispatchLogs) {
  (globalThis as any).__inMemoryEmailDispatchLogs = [];
}

export async function GET(req: NextRequest) {
  try {
    let db: any = null;

    try {
      const dynamicRequire = eval('require');
      const { getRequestContext } = dynamicRequire('@opennext' + 'js/cloudflare');
      const ctx = getRequestContext();
      if (ctx?.env?.DB) {
        db = ctx.env.DB;
      }
    } catch (e) {
      // Ignored
    }

    if (!db) {
      db = (process.env as any).DB;
    }

    let orders: any[] = [];
    let mastercardEnabled = true;

    // Retrieve from Cloudflare D1
    if (db && typeof db.prepare === 'function') {
      try {
        const ordersResult = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
        orders = ordersResult.results || [];

        const settingRow = await db.prepare("SELECT value FROM admin_settings WHERE key = 'mastercard_payments_enabled'").all();
        if (settingRow?.results && settingRow.results.length > 0) {
          mastercardEnabled = settingRow.results[0].value === 'true';
        }
      } catch (err: any) {
        console.error('Error fetching admin details from D1:', err);
      }
    } else {
      // Fallback sandbox variables
      orders = [...(globalThis as any).__inMemoryOrdersStore].reverse();
      mastercardEnabled = (globalThis as any).__inMemoryAdminSettings['mastercard_payments_enabled'] === 'true';
    }

    // Retrieve email logs from global store or database
    let emailDispatches: any[] = [];
    if (db && typeof db.prepare === 'function') {
      try {
        const logsResult = await db.prepare("SELECT * FROM email_logs ORDER BY timestamp DESC").all();
        emailDispatches = logsResult.results?.map((r: any) => ({
          id: r.id,
          orderId: r.order_id,
          customerEmail: r.customer_email,
          timestamp: r.timestamp,
          subject: r.subject
        })) || [];
      } catch (e) {
        console.warn('Could not read email_logs table, using in-memory backup logs:', e);
        emailDispatches = (globalThis as any).__inMemoryEmailDispatchLogs || [];
      }
    } else {
      emailDispatches = (globalThis as any).__inMemoryEmailDispatchLogs || [];
    }

    return NextResponse.json({
      success: true,
      orders,
      mastercard_payments_enabled: mastercardEnabled,
      email_dispatches: emailDispatches
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId, status, mastercard_payments_enabled } = body;

    let db: any = null;
    try {
      const dynamicRequire = eval('require');
      const { getRequestContext } = dynamicRequire('@opennext' + 'js/cloudflare');
      const ctx = getRequestContext();
      if (ctx?.env?.DB) {
        db = ctx.env.DB;
      }
    } catch (e) {
      // Ignored
    }
    if (!db) {
      db = (process.env as any).DB;
    }

    // Toggle administrative mastercard enablement
    if (action === 'update-settings') {
      const isEnabledString = mastercard_payments_enabled === true ? 'true' : 'false';

      if (db && typeof db.prepare === 'function') {
        await db.prepare("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('mastercard_payments_enabled', ?)")
          .bind(isEnabledString)
          .run();
      } else {
        (globalThis as any).__inMemoryAdminSettings['mastercard_payments_enabled'] = isEnabledString;
      }

      return NextResponse.json({ success: true, message: `Mastercard gateway toggled to ${isEnabledString}.` });
    }

    // Update individual order payment status (Pending Payment -> Paid | Failed)
    if (action === 'update-status') {
      if (!orderId || !status) {
        return NextResponse.json({ success: false, error: 'Missing parameter orderId or status.' }, { status: 400 });
      }

      if (db && typeof db.prepare === 'function') {
        await db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?")
          .bind(status, orderId)
          .run();
      } else {
        const store = (globalThis as any).__inMemoryOrdersStore;
        const index = store.findIndex((o: any) => o.id === orderId);
        if (index !== -1) {
          store[index].payment_status = status;
        } else {
          return NextResponse.json({ success: false, error: 'Order not found in virtual sandbox store.' }, { status: 404 });
        }
      }

      return NextResponse.json({ success: true, message: `Order status changed to ${status}.` });
    }

    // Resend payment instruction triggers
    if (action === 'resend-instructions') {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'Missing orderId parameter.' }, { status: 400 });
      }

      let order: any = null;

      if (db && typeof db.prepare === 'function') {
        const res = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).all();
        if (res?.results && res.results.length > 0) {
          order = res.results[0];
        }
      } else {
        const store = (globalThis as any).__inMemoryOrdersStore;
        order = store.find((o: any) => o.id === orderId);
      }

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found for triggered notification.' }, { status: 404 });
      }

      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        parsedItems = [];
      }

      // Re-trigger the rich unified deliverAllCheckoutAutomation
      const compiledOrder = {
        id: order.id,
        items: parsedItems,
        total: order.total,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_address: order.customer_address,
        customer_country: order.customer_country || 'United States',
        payment_method: order.payment_method,
        shipping_method: order.shipping_method || 'Normal',
        coupon_code: order.coupon_code || null,
        discount_percentage: order.discount_percentage || 0,
        discount_amount: order.discount_amount || 0,
        crypto_discount: order.crypto_discount || 0,
        created_at: order.created_at
      };

      const dispatchLog = await deliverAllCheckoutAutomation(compiledOrder, db);

      // Return log payload back
      return NextResponse.json({
        success: true,
        message: `Mastercard payment instruction email resubmitted for Order #${orderId.substring(0, 8)}.`,
        dispatch: {
          id: dispatchLog.dispatchId,
          orderId: order.id,
          customerEmail: order.customer_email,
          timestamp: dispatchLog.timestamp,
          subject: dispatchLog.subject
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid operation action parameter.' }, { status: 400 });

  } catch (err: any) {
    console.error('Admin order api mutation crash:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
