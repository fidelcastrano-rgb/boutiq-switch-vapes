import { NextRequest, NextResponse } from 'next/server';

// Global mock in-memory storage for development testing when D1 binding is not defined
// (Useful on preview containers/staging pages before production Wrangler deploy binds env.DB)
if (!(globalThis as any).__inMemoryOrdersStore) {
  (globalThis as any).__inMemoryOrdersStore = [];
}

export async function POST(req: NextRequest) {
  try {
    // 1. Retrieve and parse request payload
    const body = await req.json();
    const { items, total, customer } = body;

    // Validate checkout payload inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your shopping cart is empty.' }, { status: 400 });
    }

    for (const item of items) {
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json({ success: false, error: 'Invalid items in request payload.' }, { status: 400 });
      }
    }

    if (typeof total !== 'number' || isNaN(total) || total <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid order total value.' }, { status: 400 });
    }

    if (!customer || !customer.name || !customer.email || !customer.address) {
      return NextResponse.json({ success: false, error: 'Missing customer contact name, email, or shipping address.' }, { status: 400 });
    }

    // Validate email format simply
    if (!customer.email.includes('@') || !customer.email.includes('.')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid customer email address.' }, { status: 400 });
    }

    // 2. Fetch D1 Binding (from request context under @opennextjs/cloudflare or process.env fallback)
    let db: any = null;

    try {
      const { getRequestContext } = require('@opennextjs/cloudflare');
      const ctx = getRequestContext();
      if (ctx?.env?.DB) {
        db = ctx.env.DB;
      }
    } catch (e) {
      // Ignored if local or @opennextjs/cloudflare context is not established
    }

    if (!db) {
      db = (process.env as any).DB;
    }

    // 3. Assemble fields for insertion
    const orderId = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'ord_' + Math.random().toString(36).substring(2, 15);

    const itemsJsonString = JSON.stringify(items);
    const createdAtTimestamp = new Date().toISOString();

    // If Cloudflare D1 database binding is NOT initialized (common in non-Wrangler preview/staging environments),
    // we use our pure-JS zero-dependency mockup to allow flawless client checkouts and full-flow validation.
    if (!db || typeof db.prepare !== 'function') {
      console.warn(
        `[D1 Preview Fallback] Real database binding "DB" was not found (expected in full Cloudflare production runtime Env). ` +
        `Saving order ${orderId} in pure-JS temporary in-memory store for seamless testing.`
      );

      // Add to in-memory store
      const orderRecord = {
        id: orderId,
        items: itemsJsonString,
        total,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_address: customer.address,
        created_at: createdAtTimestamp
      };

      (globalThis as any).__inMemoryOrdersStore.push(orderRecord);
      
      return NextResponse.json({ success: true, orderId });
    }

    // 4. Run Cloudflare D1 query in production Workers Env
    const insertSql = `
      INSERT INTO orders (id, items, total, customer_name, customer_email, customer_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.prepare(insertSql)
      .bind(
        orderId,
        itemsJsonString,
        total,
        customer.name,
        customer.email,
        customer.address,
        createdAtTimestamp
      )
      .run();

    return NextResponse.json({ success: true, orderId });

  } catch (err: any) {
    console.error('Exception error during create-order:', err);
    return NextResponse.json({ success: false, error: err.message || 'Error writing order to D1 database.' }, { status: 500 });
  }
}
