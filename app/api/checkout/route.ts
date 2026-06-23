import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { PRODUCTS } from '@/lib/data';
import { sendOrderConfirmation, sendAdminNotification } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    console.log('1. Request received for checkout');
    const body = await req.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      country,
      state,
      city,
      zip_code,
      payment_method,
      shipping_method,
      cart_items,
      coupon_code,
      cart_id
    } = body;

    // 1. Inputs validation
    if (!customer_name || !customer_email || !shipping_address || !country || !state || !city || !zip_code || !payment_method || !shipping_method) {
      return NextResponse.json({ success: false, error: 'Please fill in all required shipping and payment fields.' }, { status: 400 });
    }

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your cart is empty.' }, { status: 400 });
    }

    console.log('2. Starting order validation');
    // 2. Server-side validation of cart items & price calculation
    let subtotal = 0;
    const validatedItems = [];

    for (const item of cart_items) {
      const serverProduct = PRODUCTS.find(p => p.id === item.productId || p.id === item.id);
      if (!serverProduct) {
        return NextResponse.json({ success: false, error: `Product ID "${item.productId || item.id}" not found in our catalog.` }, { status: 404 });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ success: false, error: `Invalid quantity for item ${serverProduct.name}.` }, { status: 400 });
      }

      const itemPrice = Number(serverProduct.price);
      subtotal += itemPrice * qty;

      validatedItems.push({
        product_id: serverProduct.id,
        product_name: `${serverProduct.name}${item.variant ? ` (${item.variant})` : ''}`,
        quantity: qty,
        price: itemPrice
      });
    }

    // 3. Coupon validation (Server-side check in DB)
    let couponDiscount = 0;
    if (coupon_code && coupon_code.trim() !== '') {
      const couponRows = await query(
        'SELECT * FROM coupons WHERE UPPER(code) = ? AND active = 1',
        [coupon_code.trim().toUpperCase()]
      );
      if (couponRows && couponRows.length > 0) {
        const foundCoupon = couponRows[0];
        const pct = Number(foundCoupon.discount_percent);
        couponDiscount = (subtotal * pct) / 100;
      }
    }

    // 4. Crypto Discount validation (Automatic 10%)
    let cryptoDiscount = 0;
    if (payment_method === 'crypto') {
      cryptoDiscount = subtotal * 0.10; // 10% off
    }

    // 5. Payment method limits check
    // If not crypto and subtotal is less than $150, trigger error
    if (payment_method !== 'crypto' && subtotal < 150) {
      return NextResponse.json({
        success: false,
        error: 'Minimum order amount for this payment method is $150.'
      }, { status: 400 });
    }

    // 6. Calculate shipping cost based on requested guidelines
    let shippingCost = 20; // default normal
    const isNA = country.trim().toUpperCase() === 'UNITED STATES' || country.trim().toUpperCase() === 'US' || country.trim().toUpperCase() === 'USA' || country.trim().toUpperCase() === 'CANADA' || country.trim().toUpperCase() === 'CA';

    if (subtotal >= 500) {
      shippingCost = 0; // FREE Shipping rule
    } else {
      if (isNA) {
        if (shipping_method === 'express') {
          shippingCost = 60; // Express US/Canada
        } else {
          shippingCost = 20; // Normal US/Canada
        }
      } else {
        shippingCost = 55; // International Auto
      }
    }

    // Grand total calculation
    const totalDiscount = couponDiscount + cryptoDiscount;
    const grandTotal = Math.max(0, subtotal - totalDiscount + shippingCost);

    // 7. Store order inside DB
    console.log('3. Proceeding to D1 database insert');
    const orderId = crypto.randomUUID();
    const orderNumber = `BSV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Prepare inputs
      await execute(
        `INSERT INTO orders (
          id, order_number, customer_name, customer_email, customer_phone, 
          shipping_address, country, state, city, zip_code, 
          subtotal, shipping_cost, discount_amount, coupon_code, 
          payment_method, order_total, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment')`,
        [
          orderId, orderNumber, customer_name, customer_email, customer_phone || null,
          shipping_address, country, state, city, zip_code,
          subtotal, shippingCost, totalDiscount, coupon_code || null,
          payment_method, grandTotal
        ]
      );

      // Insert order items
      for (const item of validatedItems) {
        const itemRowId = crypto.randomUUID();
        await execute(
          'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
          [itemRowId, orderId, item.product_id, item.product_name, item.quantity, item.price]
        );
      }
    } catch (dbErr: any) {
      console.error('Database Insert Error:', dbErr);
      return NextResponse.json({ success: false, error: 'Database error storing order details: ' + (dbErr.message || '') }, { status: 500 });
    }

    // 8. Delete corresponding abandoned cart now that they checked out successfully
    if (cart_id) {
      await execute('DELETE FROM abandoned_carts WHERE id = ?', [cart_id]);
    }
    // Also delete any other session by this email
    await execute('DELETE FROM abandoned_carts WHERE customer_email = ?', [customer_email]);

    // Construct completed order object for emails
    const finalizedOrder = {
      id: orderId,
      order_number: orderNumber,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      country,
      state,
      city,
      zip_code,
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: totalDiscount,
      coupon_code: coupon_code || null,
      payment_method,
      order_total: grandTotal,
      order_status: 'Pending Payment'
    };

    console.log('4. Order inserted into DB successfully, preparing email dispatch');
    // 9. Dispatch Resend notifications asynchronously
    // Using await Promise.allSettled to ensure order response completes and emails don't get stuck in Edge
    await Promise.allSettled([
      sendOrderConfirmation(finalizedOrder, validatedItems),
      sendAdminNotification(finalizedOrder, validatedItems)
    ]).catch(err => console.error('Error dispatching checkout emails', err));

    console.log('5. Returning final response');
    return NextResponse.json({
      success: true,
      orderNumber,
      orderId,
      grandTotal,
      message: 'Your order has been compiled with status Pending Payment. Check your inbox for payment confirmation details.'
    });

  } catch (err: any) {
    console.error('Checkout Endpoint Server Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Error compiling checkout session.' }, { status: 500 });
  }
}
