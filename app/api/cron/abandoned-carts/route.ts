import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { sendAbandonedCartReminder } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const report_1h: string[] = [];
    const report_24h: string[] = [];

    // 1. Process 1-Hour Abandoned Carts
    // SQLite compatible date subtraction query
    const candidates1h = await query(
      `SELECT * FROM abandoned_carts 
       WHERE email_1h_sent = 0 
       AND last_activity <= datetime('now', '-1 hour')`
    );

    for (const cart of candidates1h) {
      try {
        const parsedItems = JSON.parse(cart.cart_data);
        await sendAbandonedCartReminder(
          cart.customer_email,
          cart.customer_name,
          parsedItems,
          1
        );
        await execute(
          'UPDATE abandoned_carts SET email_1h_sent = 1 WHERE id = ?',
          [cart.id]
        );
        report_1h.push(`${cart.customer_email} (${cart.customer_name || 'No Name'})`);
      } catch (err: any) {
        console.error(`Failed to handle 1h cart for ${cart.customer_email}`, err);
      }
    }

    // 2. Process 24-Hour Abandoned Carts
    const candidates24h = await query(
      `SELECT * FROM abandoned_carts 
       WHERE email_24h_sent = 0 
       AND last_activity <= datetime('now', '-24 hours')`
    );

    for (const cart of candidates24h) {
      try {
        const parsedItems = JSON.parse(cart.cart_data);
        await sendAbandonedCartReminder(
          cart.customer_email,
          cart.customer_name,
          parsedItems,
          24
        );
        await execute(
          'UPDATE abandoned_carts SET email_24h_sent = 1, email_1h_sent = 1 WHERE id = ?',
          [cart.id]
        );
        report_24h.push(`${cart.customer_email} (${cart.customer_name || 'No Name'})`);
      } catch (err: any) {
        console.error(`Failed to handle 24h cart for ${cart.customer_email}`, err);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        processed_1h_count: report_1h.length,
        processed_24h_count: report_24h.length,
      },
      details: {
        emailed_1h: report_1h,
        emailed_24h: report_24h,
      }
    });

  } catch (err: any) {
    console.error('Abandoned Cart Cron Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
