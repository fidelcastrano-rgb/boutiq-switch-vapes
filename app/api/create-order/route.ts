import { NextRequest, NextResponse } from 'next/server';

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

    // Raise clear error if no Cloudflare Workers D1 binding is found
    if (!db || typeof db.prepare !== 'function') {
      console.error('Cloudflare D1 Database binding was not located in getRequestContext() or process.env.DB');
      return NextResponse.json({
        success: false,
        error: 'Database connector error: Cloudflare D1 binding "DB" is not initialized in the runtime context.'
      }, { status: 500 });
    }

    // 3. Assemble fields for insertion
    const orderId = typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'ord_' + Math.random().toString(36).substring(2, 15);

    const itemsJsonString = JSON.stringify(items);
    const createdAtTimestamp = new Date().toISOString();

    // 4. Run Cloudflare D1 query
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
