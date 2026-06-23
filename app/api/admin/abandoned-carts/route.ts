import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Read all synchronized abandoned carts in real-time
    const carts = await query('SELECT * FROM abandoned_carts ORDER BY last_activity DESC');
    return NextResponse.json({ success: true, carts });
  } catch (err: any) {
    console.error('Fetch Admin Abandoned Carts Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
