import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing order reference ID.' }, { status: 400 });
    }

    let db: any = null;
    try {
      const dynamicRequire = require;
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

    let order: any = null;

    if (db && typeof db.prepare === 'function') {
      try {
        const result = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).all();
        if (result?.results && result.results.length > 0) {
          order = result.results[0];
        }
      } catch (err: any) {
        console.error('Error querying single order from D1:', err);
      }
    } else {
      // Fallback sandbox variables lookup
      const store = (globalThis as any).__inMemoryOrdersStore || [];
      order = store.find((o: any) => o.id === id);
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    // Parse items to JSON if stored as string
    let parsedItems = [];
    try {
      parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {
      parsedItems = [];
    }

    const compiledOrder = {
      ...order,
      items: parsedItems
    };

    return NextResponse.json({
      success: true,
      order: compiledOrder
    });

  } catch (err: any) {
    console.error('Single order details retrieval exception:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
