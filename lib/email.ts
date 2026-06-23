import { Resend } from 'resend';
import { generateInvoicePdfBuffer, generateInvoiceHtml } from './invoice';

let resendInstance: Resend | null = null;

/**
 * Returns a lazily-initialized Resend client if RESEND_API_KEY is present in the environment.
 */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.trim() === '') {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

/**
 * Retrieves the specific instructions text based on selected payment method.
 */
export function getPaymentInstructionsText(paymentMethod: string, total: number, orderId: string): { text: string; html: string } {
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const amountStr = total.toFixed(2);
  const methodUpper = paymentMethod.toUpperCase();

  if (methodUpper.includes('CRYPTO') || methodUpper.includes('BITCOIN') || methodUpper.includes('USDT') || methodUpper.includes('USDC') || methodUpper.includes('ETHEREUM')) {
    const text = `To complete your payment of $${amountStr} via Cryptocurrency, send exact funds to one of our secure billing wallets:
- BTC (Bitcoin Network): bc1q8w4ptkndm72z5vskex8px5x2e2l970xkq9p0jdf
- USDT (ERC20): 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
- USDC (ERC20): 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
- ETH (ERC20): 0x71C7656EC7ab88b098defB751B7401B5f6d8976F
Please reply to this email with a screenshot of your transfer transaction receipt and include Order #${shortOrderId} once cleared. Payment Deadline: 48 Hours.`;

    const html = `
      <div style="background-color: #1a1a1f; border-left: 4px solid #d4af37; padding: 20px; border-radius: 0 16px 16px 0; color: #ffffff;">
        <h4 style="margin: 0 0 10px 0; color: #d4af37; text-transform: uppercase; font-size: 14px; tracking: 1px;">Cryptocurrency Details</h4>
        <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 1.5; color: #d1d1d6;">
          Please send exactly <strong style="color: #ffffff; font-family: monospace;">$${amountStr}</strong> within <strong>48 Hours</strong> to any of the secure corporate wallets below:
        </p>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.8; color: #a1a1aa; font-family: monospace;">
          <li style="margin-bottom: 6px;"><strong style="color: #ffffff; font-family: sans-serif;">BTC:</strong> bc1q8w4ptkndm72z5vskex8px5x2e2l970xkq9p0jdf</li>
          <li style="margin-bottom: 6px;"><strong style="color: #ffffff; font-family: sans-serif;">USDT (ERC-20):</strong> 0x71C7656EC7ab88b098defB751B7401B5f6d8976F</li>
          <li style="margin-bottom: 6px;"><strong style="color: #ffffff; font-family: sans-serif;">USDC (ERC-20):</strong> 0x71C7656EC7ab88b098defB751B7401B5f6d8976F</li>
          <li style="margin-bottom: 6px;"><strong style="color: #ffffff; font-family: sans-serif;">ETH (ERC-20):</strong> 0x71C7656EC7ab88b098defB751B7401B5f6d8976F</li>
        </ul>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #a1a1aa;">
          <em>Once submitted, reply directly to this email with a screenshot of the blockchain clearance to fast-track shipping!</em>
        </p>
      </div>
    `;
    return { text, html };
  }

  if (methodUpper.includes('APPLE')) {
    const text = `To complete your payment of $${amountStr} via Apple Cash, send exactly $${amountStr} to billing-apple@boutiqvapes.us. Please ensure you include Order #${shortOrderId} in the transaction details/memo. Payment Deadline: 48 Hours.`;
    const html = `
      <div style="background-color: #1a1a1f; border-left: 4px solid #d4af37; padding: 20px; border-radius: 0 16px 16px 0; color: #ffffff;">
        <h4 style="margin: 0 0 10px 0; color: #d4af37; text-transform: uppercase; font-size: 14px; tracking: 1px;">Apple Cash Instructions</h4>
        <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5; color: #d1d1d6;">
          To complete payment, transfer exactly <strong style="color: #ffffff; font-family: monospace;">$${amountStr}</strong> within <strong>48 Hours</strong>:
        </p>
        <p style="margin: 0 0 8px 0; font-size: 14px; font-family: monospace; color: #ffffff; font-weight: bold; background-color: #09090b; padding: 10px; border-radius: 8px; display: inline-block;">
          Recipient Email: balance-hold@boutiqvapes.us
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">
          * VERY IMPORTANT: Please write <strong style="color: #ffffff;">#${shortOrderId}</strong> clearly in your Apple Cash transfer message/memo.
        </p>
      </div>
    `;
    return { text, html };
  }

  if (methodUpper.includes('CHIME')) {
    const text = `To complete your payment of $${amountStr} via Chime, please transfer exactly $${amountStr} to our corporate Chime tag: @BoutiqVapesHold. Ensure you write Order #${shortOrderId} in transfer comments. Payment Deadline: 48 Hours.`;
    const html = `
      <div style="background-color: #1a1a1f; border-left: 4px solid #d4af37; padding: 20px; border-radius: 0 16px 16px 0; color: #ffffff;">
        <h4 style="margin: 0 0 10px 0; color: #d4af37; text-transform: uppercase; font-size: 14px; tracking: 1px;">Chime Instructions</h4>
        <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5; color: #d1d1d6;">
          To complete payment, send exactly <strong style="color: #ffffff; font-family: monospace;">$${amountStr}</strong> within <strong>48 Hours</strong>:
        </p>
        <p style="margin: 0 0 8px 0; font-size: 14px; font-family: monospace; color: #ffffff; font-weight: bold; background-color: #09090b; padding: 10px; border-radius: 8px; display: inline-block;">
          Chime Tag: @BoutiqVapesHold
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">
          * VERY IMPORTANT: Please write <strong style="color: #ffffff;">#${shortOrderId}</strong> in your Chime payment comment.
        </p>
      </div>
    `;
    return { text, html };
  }

  // Fallback Credit Card / Mastercard
  const text = `Secure credit card transaction of $${amountStr} is currently pending clearance check for Order #${shortOrderId}. Please authorize the verification hold prompt received via banking SMS or authentic authorization screen. Once verified by our payment gateway merchant, ship dispatch will initiate instantly.`;
  const html = `
    <div style="background-color: #1a1a1f; border-left: 4px solid #d4af37; padding: 20px; border-radius: 0 16px 16px 0; color: #ffffff;">
      <h4 style="margin: 0 0 10px 0; color: #d4af37; text-transform: uppercase; font-size: 14px; tracking: 1px;">Credit Card Hold Verification</h4>
      <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.5; color: #d1d1d6;">
        Your Mastercard payment of <strong style="color: #ffffff; font-family: monospace;">$${amountStr}</strong> is on temporary reservation.
      </p>
      <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
        Please open your mobile bank terminal, authorize the clearance notification, or verify the SMS pin checkout trigger. Once verified, order status updates automatically.
      </p>
    </div>
  `;
  return { text, html };
}

/**
 * Automates the creation, saving, logging, and dispatching of:
 * - Payment Instructions (Customer Email)
 * - Order Confirmation Receipt (Customer Email, with PDF attached)
 * - Admin Notification (Admin Alert Email)
 */
export async function deliverAllCheckoutAutomation(order: any, db?: any) {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const resend = getResend();
  
  // 1. Generate PDF Invoice Buffer
  const pdfInvoiceBuff = generateInvoicePdfBuffer(order);

  // 2. Fetch specific instructions
  const instructions = getPaymentInstructionsText(order.payment_method || 'Mastercard', order.total || 0, order.id);

  // 3. Render HTML confirm receipt
  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation #${shortId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #ffffff; margin: 0; padding: 40px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #121214; border: 1px solid #1f1f23; border-radius: 24px; padding: 40px; box-sizing: border-box;">
          
          <!-- Corporate Header -->
          <div style="border-bottom: 1px solid #1f1f23; padding-bottom: 20px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 0;">Boutiq Switch Vapes</h1>
            <p style="color: #d4af37; font-size: 10px; font-weight: bold; letter-spacing: 2px; margin: 4px 0 0 0; text-transform: uppercase;">Order Submission Confirmation</p>
          </div>

          <p style="color: #e4e4e7; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${order.customer_name || 'Valued Customer'}</strong>,</p>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for checking out with Boutiq Switch Vapes! Your order has been safely received under reference <strong>#${shortId}</strong>. Our team will contact you shortly with the manual payment instructions to complete your purchase. Below is a summary of your order metrics. We have also attached your PDF Invoice to this email.
          </p>

          <!-- Checkout Details -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0; color: #71717a;">Shipping Method:</td>
              <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: bold;">${order.shipping_method || 'Normal'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0; color: #71717a;">Payment Option:</td>
              <td style="padding: 8px 0; color: #ffffff; text-align: right; font-weight: bold;">${order.payment_method}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0; color: #71717a;">Total Amount Due:</td>
              <td style="padding: 8px 0; color: #d4af37; text-align: right; font-weight: bold; font-size: 15px; font-family: monospace;">$${Number(order.total).toFixed(2)}</td>
            </tr>
          </table>

          <!-- Track Booking CTA -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="https://ais-dev-io367hmx76fwerhya7j2yj-482663104829.europe-west1.run.app/shipping?orderId=${order.id}" style="background-color: #d4af37; color: #000000; text-decoration: none; font-size: 13px; font-weight: bold; padding: 12px 30px; border-radius: 12px; display: inline-block;">
              Track My Order State
            </a>
          </div>

          <div style="text-align: center; border-top: 1px solid #1f1f23; padding-top: 20px; font-size: 11px; color: #71717a;">
            <p style="margin: 0 0 4px 0;">Secure server-side distributed checkout gateway.</p>
            <p style="margin: 0;">© 2026 Boutiq Switch Vapes. All rights reserved.</p>
          </div>

        </div>
      </body>
    </html>
  `;

  // 4. Send Confirmation & Instructions to Customer (With PDF Attachment)
  let liveCustomerDispatched = false;
  let customerResendId = null;

  if (resend) {
    try {
      const senderEmail = process.env.RESEND_FROM_EMAIL || 'Boutiq Switch Vapes <orders@boutiqswitchvapes.us>';
      const data = await resend.emails.send({
        from: senderEmail,
        to: [order.customer_email],
        subject: `Order Confirmation #${shortId}`,
        html: customerEmailHtml,
        attachments: [
          {
            filename: `invoice_${shortId}.pdf`,
            content: pdfInvoiceBuff.toString('base64'),
          }
        ]
      });
      customerResendId = (data as any)?.id || null;
      liveCustomerDispatched = true;
      console.log('Fulfillment Automation: Sent payment instructions + PDF to customer:', data);
    } catch (e) {
      console.error('Fulfillment Automation customer dispatch error:', e);
    }
  }

  // 5. Admin Alert Notification Email
  const adminEmailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Received: #${shortId}</title>
      </head>
      <body style="font-family: sans-serif; background-color: #09090b; color: #ffffff; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #121214; border: 1px solid #1f1f23; padding: 30px; border-radius: 16px;">
          <h2 style="color: #d4af37; margin: 0; text-transform: uppercase;">[ADMIN NOTIFICATION]</h2>
          <p style="color: #ffffff; font-size: 15px;">A new customer order has been safely recorded in Database!</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; color: #a1a1aa;">
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Order Number:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">#${shortId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Customer Name:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${order.customer_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Customer Email:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${order.customer_email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Customer Country:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${order.customer_country || 'United States'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Shipping Method:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${order.shipping_method || 'Normal'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Payment Method:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${order.payment_method}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Coupon Code used:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">${order.coupon_code || 'None'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Coupon Discount Amount:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">-$${Number(order.discount_amount || 0).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Crypto Discount Amount:</td>
              <td style="color: #ffffff; font-weight: bold; text-align: right;">-$${Number(order.crypto_discount || 0).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1f1f23;">
              <td style="padding: 8px 0;">Final Grand Total:</td>
              <td style="color: #d4af37; font-weight: bold; text-align: right; font-size: 15px; font-family: monospace;">$${Number(order.total).toFixed(2)}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; text-align: center; display: flex; gap: 10px; justify-content: center;">
            <a href="https://ais-dev-io367hmx76fwerhya7j2yj-482663104829.europe-west1.run.app/admin" style="background-color: #27272a; color: #ffffff; padding: 10px 20px; font-size: 12px; font-weight: bold; border-radius: 8px; text-decoration: none;">
              View General Admin Dashboard
            </a>
          </div>

        </div>
      </body>
    </html>
  `;

  if (resend) {
    try {
      const senderEmail = process.env.RESEND_FROM_EMAIL || 'Boutiq Switch Vapes <orders@boutiqswitchvapes.us>';
      const adminEmail = process.env.ADMIN_EMAIL || 'sales@boutiqswitchvapes.us';
      await resend.emails.send({
        from: senderEmail,
        to: [adminEmail],
        subject: `[NEW BOOKING ALERT] Order #${shortId} placed by ${order.customer_name}`,
        html: adminEmailHtml,
      });
      console.log('Fulfillment Automation: Dispatched alert to Admin inbox.');
    } catch (e) {
      console.error('Fulfillment Automation admin alert sending error:', e);
    }
  }

  // 6. Log payment instruction email in email_logs table
  const logId = 'dispatch_' + Math.random().toString(36).substring(2, 10);
  const logSubject = `Payment Instructions for Order #${shortId}`;
  const logMsg = instructions.text;
  const timestamp = new Date().toISOString();
  const liveCount = liveCustomerDispatched ? 1 : 0;
  const rResp = customerResendId || 'Simulated';

  if (db && typeof db.prepare === 'function') {
    try {
      await db.prepare(`
        INSERT INTO email_logs (id, order_id, customer_email, timestamp, subject, message, is_live, response)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(logId, order.id, order.customer_email, timestamp, logSubject, logMsg, liveCount, rResp)
      .run();
    } catch (dbErr) {
      console.error('Error inserting log in D1 SQLite table:', dbErr);
    }
  }

  // Also log in virtual fallback container logs array
  if (!(globalThis as any).__inMemoryEmailDispatchLogs) {
    (globalThis as any).__inMemoryEmailDispatchLogs = [];
  }
  (globalThis as any).__inMemoryEmailDispatchLogs.push({
    id: logId,
    orderId: order.id,
    customerEmail: order.customer_email,
    timestamp,
    subject: logSubject,
    message: logMsg,
    isLive: liveCustomerDispatched,
    resendResponse: rResp
  });

  return {
    success: true,
    dispatchId: logId,
    resendResponse: rResp,
    subject: logSubject,
    timestamp,
    message: logMsg
  };
}

/**
 * Backwards compatible basic dispatcher
 */
export async function sendPaymentInstructions({
  to,
  orderId,
  customerName,
  items,
  total,
}: {
  to: string;
  orderId: string;
  customerName: string;
  items: any[];
  total: number;
}) {
  // Construct dummy order record to bypass standard automation deliverer
  const mockOrder = {
    id: orderId,
    items: JSON.stringify(items),
    total,
    customer_name: customerName,
    customer_email: to,
    payment_method: 'Mastercard',
    shipping_method: 'Normal',
    coupon_code: null,
    discount_percentage: 0,
    discount_amount: 0,
    crypto_discount: 0,
    customer_country: 'United States',
    created_at: new Date().toISOString()
  };

  const dispatchRes = await deliverAllCheckoutAutomation(mockOrder);
  return {
    id: dispatchRes.dispatchId,
    orderId,
    customerEmail: to,
    timestamp: new Date().toISOString(),
    subject: `Payment Instructions for Order #${orderId.substring(0, 8).toUpperCase()}`,
    message: `Thank you for your order. Mastercard payment instructions have been sent for Order #${orderId.substring(0, 8).toUpperCase()}. Please follow the instructions provided to complete payment.`
  };
}
