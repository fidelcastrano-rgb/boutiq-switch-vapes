import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid coupon code.' }, { status: 400 });
    }

    // Secure database query using safe prepared binds
    const coupons = await query(
      'SELECT * FROM coupons WHERE UPPER(code) = ? AND active = 1',
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return NextResponse.json({ success: false, error: 'Coupon code is invalid, expired, or inactive.' }, { status: 404 });
    }

    const coupon = coupons[0];
    return NextResponse.json({
      success: true,
      code: coupon.code,
      discount_percent: coupon.discount_percent
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Error occurred.' }, { status: 500 });
  }
}
