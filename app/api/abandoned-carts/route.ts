import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, customer_email, customer_name, cart_items } = body;

    if (!id || !customer_email) {
      return NextResponse.json({ success: false, error: 'Missing mandatory cart tracking parameters.' }, { status: 400 });
    }

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      // If client cart becomes empty, clean up any tracked abandoned session
      await execute('DELETE FROM abandoned_carts WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Removed empty tracked session.' });
    }

    const itemsJson = JSON.stringify(cart_items);

    // UPSERT statement to save/update tracked session using standard SQLite CONFLICT resolution
    await execute(
      `INSERT INTO abandoned_carts (
        id, customer_email, customer_name, cart_data, email_1h_sent, email_24h_sent, last_activity
      ) VALUES (?, ?, ?, ?, 0, 0, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        customer_email = excluded.customer_email,
        customer_name = excluded.customer_name,
        cart_data = excluded.cart_data,
        email_1h_sent = 0,
        email_24h_sent = 0,
        last_activity = datetime('now')`,
      [id, customer_email, customer_name || null, itemsJson]
    );

    return NextResponse.json({ success: true, message: 'Abandoned session synchronized successfully.' });
  } catch (err: any) {
    console.error('Abandoned Cart Sync Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
