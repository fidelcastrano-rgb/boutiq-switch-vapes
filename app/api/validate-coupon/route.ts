import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, couponCode } = await req.json();

    if (!couponCode || couponCode.trim().toUpperCase() !== 'WELCOME10') {
      return NextResponse.json({ success: false, error: 'Invalid coupon code.' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address first.' }, { status: 400 });
    }

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

    const lowerEmail = email.trim().toLowerCase();
    let existingCount = 0;

    if (db && typeof db.prepare === 'function') {
      try {
        const result = await db.prepare("SELECT COUNT(*) as count FROM orders WHERE LOWER(customer_email) = ?")
          .bind(lowerEmail)
          .all();
        if (result?.results && result.results.length > 0) {
          existingCount = Number(result.results[0].count || 0);
        }
      } catch (err) {
        console.warn('Error checking existing orders in D1, falling back to in-memory check:', err);
      }
    } else {
      const store = (globalThis as any).__inMemoryOrdersStore || [];
      existingCount = store.filter((o: any) => o.customer_email?.trim().toLowerCase() === lowerEmail).length;
    }

    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'The WELCOME10 coupon is only valid for first-time customers. Previous order historical record detected.'
      });
    }

    return NextResponse.json({
      success: true,
      discount_percentage: 10,
      message: '10% FIRST-TIME discount applied successfully!'
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
