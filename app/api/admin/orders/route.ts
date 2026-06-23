import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { sendOrderStatusUpdate } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Retrieve all orders ordered by creation date descending
    const orders = await query('SELECT * FROM orders ORDER BY created_at DESC');
    
    // Retrieve all order items
    const orderItems = await query('SELECT * FROM order_items');

    // Combine them safely in JavaScript
    const ordersWithItems = orders.map(order => {
      const items = orderItems.filter(item => item.order_id === order.id);
      return {
        ...order,
        items
      };
    });

    return NextResponse.json({ success: true, orders: ordersWithItems });
  } catch (err: any) {
    console.error('Admin Fetch Orders Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'Missing order ID or new status parameter.' }, { status: 400 });
    }

    const validStatuses = ['Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid order status value.' }, { status: 400 });
    }

    // Secure status update
    await execute('UPDATE orders SET order_status = ? WHERE id = ?', [status, orderId]);

    // Fetch the updated order to get customer email & order details
    const orderRows = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Target order not found.' }, { status: 404 });
    }

    const updatedOrder = orderRows[0];

    // Trigger status change customer notifier email asynchronously
    sendOrderStatusUpdate(updatedOrder).catch(err => {
      console.error('Failed to dispatch status change email', err);
    });

    return NextResponse.json({
      success: true,
      message: `Order status upgraded to "${status}" and customer alert dispatched.`,
      order: updatedOrder
    });
  } catch (err: any) {
    console.error('Admin Modify Order Status Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
