import { NextRequest, NextResponse } from 'next/server';
import { isMastercard } from '@/lib/validation';
import { sendPaymentInstructions } from '@/lib/email';

// Ensure in-memory stores are initialized for non-Wrangler staging / preview containers
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
    const { items, total, customer, card_number } = body;

    // 1. Basic structural input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your shopping cart is currently empty.' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json({ success: false, error: 'Invalid items in shopping cart payload.' }, { status: 400 });
      }
    }

    if (typeof total !== 'number' || isNaN(total) || total <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid order total calculated.' }, { status: 400 });
    }

    if (!customer || !customer.name || !customer.email || !customer.address) {
      return NextResponse.json({ success: false, error: 'Please enter shipping contact details, name and email.' }, { status: 400 });
    }

    if (!customer.email.includes('@') || !customer.email.includes('.')) {
      return NextResponse.json({ success: false, error: 'Please specify a valid email address.' }, { status: 400 });
    }

    // 2. Validate Credit Card Details (Require Mastercard)
    if (!card_number) {
      return NextResponse.json({ success: false, error: 'Please enter a valid credit card number for checkout.' }, { status: 400 });
    }

    if (!isMastercard(card_number)) {
      return NextResponse.json({
        success: false,
        error: 'Only Mastercard payments are currently accepted. Please use a Mastercard or select another payment method.'
      }, { status: 400 });
    }

    const sanitizedCard = card_number.replace(/\s|-/g, '');
    const cardLast4 = sanitizedCard.slice(-4);

    // 3. Cloudflare D1 Database Binding setup
    let db: any = null;

    try {
      const dynamicRequire = require;
      const { getRequestContext } = dynamicRequire('@opennext' + 'js/cloudflare');
      const ctx = getRequestContext();
      if (ctx?.env?.DB) {
        db = ctx.env.DB;
      }
    } catch (e) {
      // Ignore if opennextjs contexts are unavailable
    }

    if (!db) {
      db = (process.env as any).DB;
    }

    // Generate unique order reference ID (similar to UUID)
    const orderId = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'B_ORD_' + Math.random().toString(36).substring(2, 12).toUpperCase();

    const itemsJsonString = JSON.stringify(items);
    const createdAtTimestamp = new Date().toISOString();

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
      // Staging / sandbox fallback read
      mastercardEnabled = (globalThis as any).__inMemoryAdminSettings['mastercard_payments_enabled'] === 'true';
    }

    // Reject checkout if administrative block is configured
    if (!mastercardEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Mastercard payment checkout processing is temporarily offline. Please contact customer support.'
      }, { status: 403 });
    }

    // 5. Insert order into Database backend context
    if (db && typeof db.prepare === 'function') {
      const insertSql = `
        INSERT INTO orders (id, items, total, customer_name, customer_email, customer_address, payment_method, payment_status, card_last4, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Mastercard', 'Pending Payment', ?, ?)
      `;

      await db.prepare(insertSql)
        .bind(
          orderId,
          itemsJsonString,
          total,
          customer.name,
          customer.email,
          customer.address,
          cardLast4,
          createdAtTimestamp
        )
        .run();
    } else {
      // Interactive browser container sandbox state sync
      const orderRecord = {
        id: orderId,
        items: itemsJsonString,
        total,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_address: customer.address,
        payment_method: 'Mastercard',
        payment_status: 'Pending Payment',
        card_last4: cardLast4,
        created_at: createdAtTimestamp
      };

      (globalThis as any).__inMemoryOrdersStore.push(orderRecord);
    }

    // Trigger payment instructions email (via Resend if configured, else fallback simulator)
    try {
      await sendPaymentInstructions({
        to: customer.email,
        orderId,
        customerName: customer.name,
        items,
        total
      });
    } catch (emailErr) {
      console.warn('Non-blocking error dispatching payment confirmation instructions:', emailErr);
    }

    // Success response structure
    return NextResponse.json({
      success: true,
      orderId: orderId
    });

  } catch (err: any) {
    console.error('Checkout processing error exception:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Severe database error processing checkout pipeline.'
    }, { status: 500 });
  }
}
