import { NextRequest, NextResponse } from 'next/server';
import { isMastercard } from '@/lib/validation';
import { ensureDbTuned } from '@/lib/db';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      items, 
      customer, 
      shipping_method, 
      payment_method, 
      coupon_code,
      card_number 
    } = body;

    // 1. Basic structural input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your shopping cart is currently empty.' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json({ success: false, error: 'Invalid items in shopping cart payload.' }, { status: 400 });
      }
    }

    if (!customer || !customer.name || !customer.email || !customer.address || !customer.country) {
      return NextResponse.json({ success: false, error: 'Please enter shipping destination contact details, country, name, and email.' }, { status: 400 });
    }

    if (!customer.email.includes('@') || !customer.email.includes('.')) {
      return NextResponse.json({ success: false, error: 'Please specify a valid email address.' }, { status: 400 });
    }

    // Validate shipping selection
    if (!shipping_method || !['Normal', 'Express', 'Overnight'].includes(shipping_method)) {
      return NextResponse.json({ success: false, error: 'Please select a valid shipping method.' }, { status: 400 });
    }

    // Validate payment method selection
    if (!payment_method || !['Cryptocurrency', 'Apple Cash', 'Chime'].includes(payment_method)) {
      return NextResponse.json({ success: false, error: 'Please select a valid payment method.' }, { status: 400 });
    }

    let cardLast4: string | null = null;

    // 3. Cloudflare D1 Backend Binding setup
    let db: any = null;
    try {
      const dynamicRequire = eval('require');
      const { getRequestContext } = dynamicRequire('@opennext' + 'js/cloudflare');
      const ctx = getRequestContext();
      if (ctx?.env?.DB) {
        db = ctx.env.DB;
      }
    } catch (e) {}

    if (!db) {
      db = (process.env as any).DB;
    }

    // Ensure D1 SQLite schema is synchronized dynamically (Self-Tuned Migration)
    if (db) {
      await ensureDbTuned(db);
    }

    // 4. Check if Mastercard Payments are enabled globally
    let mastercardEnabled = true;
    if (db && typeof db.prepare === 'function') {
      try {
        const settingRow = (await db
          .prepare("SELECT value FROM admin_settings WHERE key = 'mastercard_payments_enabled'")
          .all()) as any;
        
        if (settingRow?.results && settingRow.results.length > 0) {
          mastercardEnabled = settingRow.results[0].value === 'true';
        }
      } catch (err) {
        console.warn('Error reading admin settings from D1 database, assuming default enabled:', err);
      }
    } else {
      mastercardEnabled = (globalThis as any).__inMemoryAdminSettings['mastercard_payments_enabled'] === 'true';
    }

    // 5. SERVER-SIDE CALCULATION ENGINE ONLY (Recalculate Totals & Discounts)
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);

    // Coupon System Validation
    let isCouponValid = false;
    let discountPercent = 0;
    let couponDiscountAmount = 0;
    const cleanCouponCode = coupon_code ? coupon_code.trim().toUpperCase() : null;

    if (cleanCouponCode === 'WELCOME10') {
      const lowerEmail = customer.email.trim().toLowerCase();
      let emailOrderCount = 0;

      if (db && typeof db.prepare === 'function') {
        try {
          const result = await db.prepare("SELECT COUNT(*) as count FROM orders WHERE LOWER(customer_email) = ?")
            .bind(lowerEmail)
            .all();
          if (result?.results && result.results.length > 0) {
            emailOrderCount = Number(result.results[0].count || 0);
          }
        } catch (err) {
          console.warn('Error checking existing orders in D1 SQL:', err);
        }
      } else {
        const store = (globalThis as any).__inMemoryOrdersStore || [];
        emailOrderCount = store.filter((o: any) => o.customer_email?.trim().toLowerCase() === lowerEmail).length;
      }

      if (emailOrderCount > 0) {
        return NextResponse.json({
          success: false,
          error: 'The coupon WELCOME10 is only valid for first-time customers. Existing completed order history was detected.'
        }, { status: 400 });
      }

      // Valid coupon
      isCouponValid = true;
      discountPercent = 10;
      couponDiscountAmount = Number((subtotal * 0.10).toFixed(2));
    }

    // Crypto Payments 10% Discount calculation (Bitcoin, USDT, USDC, Ethereum)
    const isCrypto = payment_method === 'Cryptocurrency';
    let cryptoDiscountAmount = 0;
    if (isCrypto) {
      cryptoDiscountAmount = Number(((subtotal - couponDiscountAmount) * 0.10).toFixed(2));
    }

    // Shipping Fee selection
    let shippingFee = 20;
    if (shipping_method === 'Express') shippingFee = 35;
    else if (shipping_method === 'Overnight') shippingFee = 60;

    // Grand Final Total
    const grandTotal = Number((subtotal - couponDiscountAmount - cryptoDiscountAmount + shippingFee).toFixed(2));

    // Generate unique order reference ID (B_ORD_...)
    const orderId = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'B_ORD_' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const itemsJsonString = JSON.stringify(items);
    const createdAtTimestamp = new Date().toISOString();

    // 6. Save Order record in Database Backend
    if (db && typeof db.prepare === 'function') {
      const insertSql = `
        INSERT INTO orders (
          id, items, total, customer_name, customer_email, customer_address, 
          payment_method, payment_status, card_last4, created_at,
          shipping_method, coupon_code, discount_percentage, discount_amount, 
          crypto_discount, customer_country
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending Payment', ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.prepare(insertSql)
        .bind(
          orderId,
          itemsJsonString,
          grandTotal,
          customer.name,
          customer.email,
          customer.address,
          payment_method,
          cardLast4,
          createdAtTimestamp,
          shipping_method,
          isCouponValid ? 'WELCOME10' : null,
          discountPercent,
          couponDiscountAmount,
          cryptoDiscountAmount,
          customer.country
        )
        .run();
    } else {
      // Sandbox fallback state
      const orderRecord = {
        id: orderId,
        items: itemsJsonString,
        total: grandTotal,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_address: customer.address,
        payment_method,
        payment_status: 'Pending Payment',
        card_last4: cardLast4,
        created_at: createdAtTimestamp,
        shipping_method,
        coupon_code: isCouponValid ? 'WELCOME10' : null,
        discount_percentage: discountPercent,
        discount_amount: couponDiscountAmount,
        crypto_discount: cryptoDiscountAmount,
        customer_country: customer.country
      };

      (globalThis as any).__inMemoryOrdersStore.push(orderRecord);
    }

    // 7. Trigger the rich email automations: Receipt, Invoice, Payment instructions, and Admin notification
    try {
      const orderDbRecord = {
        id: orderId,
        items,
        total: grandTotal,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_address: customer.address,
        payment_method: payment_method,
        shipping_method: shipping_method,
        coupon_code: isCouponValid ? 'WELCOME10' : null,
        discount_percentage: discountPercent,
        discount_amount: couponDiscountAmount,
        crypto_discount: cryptoDiscountAmount,
        customer_country: customer.country,
        created_at: createdAtTimestamp
      };

      await deliverAllCheckoutAutomation(orderDbRecord, db);
    } catch (emailErr) {
      console.warn('Non-blocking error dispatching multi-channel communications:', emailErr);
    }

    // Return success redirect key
    return NextResponse.json({
      success: true,
      orderId: orderId
    });

  } catch (err: any) {
    console.error('Checkout processing engine crash:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Server database error running calculation or inserting.'
    }, { status: 500 });
  }
}
