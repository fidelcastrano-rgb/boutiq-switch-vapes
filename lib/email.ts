import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend() {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (key && key.trim() !== '') {
    resendClient = new Resend(key);
  }
  return resendClient;
}

const ADMIN_EMAIL = 'sales@boutiqswitchvapes.us';

// Complete secure instruction templates for different payment methods
const PAYMENT_INSTRUCTIONS: Record<string, string> = {
  crypto: `
    <h3>Cryptocurrency Payment Instructions (10% Discount Applied!)</h3>
    <p>Please send the final total to one of our verified company addresses below. Secure processing is automated.</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace;">
      <strong>USDT (TRC20):</strong> TTxB6Yf8Nsh9P2uVvBns8Y7uQns92bC7xY<br/>
      <strong>Bitcoin (BTC):</strong> bc1q7y9wsh2bcy97sw8ynshwu872bnw0a9ws7ynsqq<br/>
      <strong>Ethereum (ETH):</strong> 0x7Bd3b9C4f7C2bDeCDe9B2Bde33De73FDE9B969FF
    </div>
    <p><em>Note: Once sent, please reply to this email or send a screenshot of your transaction confirmation to our sales team on WhatsApp.</em></p>
  `,
  chime: `
    <h3>Chime Payment Instructions</h3>
    <p>Thank you for choosing Chime. To complete your order, send the total amount to the Chime Pay handle below:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace;">
      <strong>Chime Handle:</strong> $BoutiqSwitchDistro
    </div>
    <p>Please include your <strong>Order Number</strong> in the payment notes. Your order will move into 'Processing' immediately after cash confirmation.</p>
  `,
  apple_cash: `
    <h3>Apple Cash Payment Instructions</h3>
    <p>Thank you for choosing Apple Cash. To complete your secure transaction:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace;">
      <strong>Apple Cash Number:</strong> +1 (650) 843-9821
    </div>
    <p>Please text your <strong>Order Number</strong> as reference during the transfer. As soon as received, your order will slide into processing status.</p>
  `,
  credit_card: `
    <h3>MasterCard Payment Invoice</h3>
    <p>Thank you for choosing Credit Card (MasterCard). Because card processing of THC vapes requires strict validation, we handle payments via a private manual voucher link:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px;">
      <strong>Voucher Payment Step:</strong> A personal invoice containing your checkout amount has been requested. We will email you a secure checkout link shortly to verify your MasterCard credentials.
    </div>
    <p>Alternatively, if you would like to expedite this, you can choose Cryptocurrency on your next checkout for an immediate automatic 10% discount and instant shipping.</p>
  `,
};

function formatProductsList(items: any[]) {
  return items
    .map(
      item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.product_name || item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${Number(item.price).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');
}

export async function sendOrderConfirmation(order: any, items: any[]) {
  const resend = getResend();
  const subject = `Order Confirmation - #${order.order_number}`;
  const instructions = PAYMENT_INSTRUCTIONS[order.payment_method] || PAYMENT_INSTRUCTIONS.crypto;
  
  const html = `
    <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h1 style="color: #000; font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 10px;">Order Confirmed!</h1>
      <p>Dear ${order.customer_name},</p>
      <p>Thank you for shopping with Boutiq Switch. Your order has been securely registered with <strong>status: Pending Payment</strong>. Below is the summary of your transaction details:</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Shipping Options:</strong> ${order.shipping_cost === 0 ? 'Free Shipping' : `$${order.shipping_cost.toFixed(2)}`}</p>
        <p><strong>Customer Phone:</strong> ${order.customer_phone || 'None provided'}</p>
        <p><strong>Shipping Location:</strong> ${order.shipping_address}, ${order.city}, ${order.state}, ${order.zip_code}, ${order.country}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${formatProductsList(items)}
        </tbody>
      </table>

      <div style="text-align: right; margin-bottom: 25px;">
        <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
        ${order.discount_amount > 0 ? `<p style="color: #ef4444;"><strong>Discount Applied:</strong> -$${order.discount_amount.toFixed(2)}</p>` : ''}
        <p><strong>Shipping Cost:</strong> $${order.shipping_cost.toFixed(2)}</p>
        <h2 style="margin: 0; color: #000;"><strong>Grand Total:</strong> $${order.order_total.toFixed(2)}</h2>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
        ${instructions}
      </div>

      <p style="font-size: 11px; color: #6b7280; margin-top: 30px; text-align: center;">
        Disclaimer: Products contain THC substances. For medical and recreational use. Keep out of reach of children.
      </p>
    </div>
  `;

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Boutiq Switch Checkout <orders@boutiqswitchvapes.us>',
        to: order.customer_email,
        subject,
        html,
      });
    } catch (err) {
      console.error('Failed to send customer confirmation email through Resend api:', err);
    }
  } else {
    console.log(`[STUB EMAIL SENT TO CUSTOMER: ${order.customer_email}]`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TOTAL: $${order.order_total}`);
  }
}

export async function sendAdminNotification(order: any, items: any[]) {
  const resend = getResend();
  const subject = `New Order Received - #${order.order_number}`;

  const html = `
    <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ef4444; border-radius: 12px;">
      <h1 style="color: #ef4444; font-size: 24px; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">New Order Alert!</h1>
      <p>A new purchase has been requested on the website. Immediate tracking action is required.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top:0;">Customer Demographics</h3>
        <p><strong>Name:</strong> ${order.customer_name}</p>
        <p><strong>Email:</strong> ${order.customer_email}</p>
        <p><strong>Phone:</strong> ${order.customer_phone || 'N/A'}</p>
        <p><strong>Shipping Destination:</strong> ${order.shipping_address}, ${order.city}, ${order.state}, ${order.zip_code}, ${order.country}</p>
      </div>

      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top:0;">Order Metrics</h3>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Payment Method:</strong> <span style="text-transform: uppercase; font-weight: bold;">${order.payment_method}</span></p>
        <p><strong>Coupon Code:</strong> ${order.coupon_code || 'None'}</p>
        <p><strong>Pre-discount Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
        <p><strong>Discount Applied:</strong> -$${order.discount_amount.toFixed(2)}</p>
        <p><strong>Shipping Charge:</strong> $${order.shipping_cost.toFixed(2)}</p>
        <h3 style="color: #000; margin-bottom: 0;"><strong>Customer Invoiced:</strong> $${order.order_total.toFixed(2)}</h3>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: center;">Desired Qty</th>
            <th style="padding: 10px; text-align: right;">Unit price</th>
          </tr>
        </thead>
        <tbody>
          ${formatProductsList(items)}
        </tbody>
      </table>

      <p style="font-size: 12px; color: #ef4444; font-weight: bold; text-align: center;">
        Configure this order inside the Boutiq Admin Panel to update customer payment confirmation status and compile logistics labels.
      </p>
    </div>
  `;

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Boutiq Website Alerts <admin@boutiqswitchvapes.us>',
        to: ADMIN_EMAIL,
        subject,
        html,
      });
    } catch (err) {
      console.error('Failed to send admin notification email through Resend api:', err);
    }
  } else {
    console.log(`[STUB EMAIL SENT TO ADMIN: ${ADMIN_EMAIL}]`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`TOTAL REVENUE: $${order.order_total}`);
  }
}

export async function sendOrderStatusUpdate(order: any) {
  const resend = getResend();
  const subject = `Order #${order.order_number} Status Update: ${order.order_status}`;

  const html = `
    <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 12px;">
      <h1 style="color: #10b981; font-size: 24px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Order Status Update</h1>
      <p>Dear ${order.customer_name},</p>
      <p>The shipping and logistics team has updated the status of your order <strong>#${order.order_number}</strong>:</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
        <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; font-family: monospace;">New Status</span>
        <h2 style="margin: 5px 0 0 0; color: #166534; font-size: 28px;">${order.order_status}</h2>
      </div>

      <p>If you have any questions or require real-time assistance regarding this status change, please get in touch with our active agents on WhatsApp immediately.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://wa.me/1234567890" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
          Support WhatsApp Chat
        </a>
      </div>

      <p style="font-size: 11px; color: #6b7280; margin-top: 35px; text-align: center;">
        Disclaimer: Products contain THC substances. For medical and recreational use. Keep out of reach of children.
      </p>
    </div>
  `;

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Boutiq Switch Logistics <orders@boutiqswitchvapes.us>',
        to: order.customer_email,
        subject,
        html,
      });
    } catch (err) {
      console.error('Failed to send status update email through Resend api:', err);
    }
  } else {
    console.log(`[STUB EMAIL SENT: STATUS UPDATE to ${order.customer_email}]`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`NEW STATUS: ${order.order_status}`);
  }
}

export async function sendAbandonedCartReminder(email: string, name: string, items: any[], hours: number) {
  const resend = getResend();
  const subject = hours === 1 
    ? "Ready to finish your Boutiq Switch order?" 
    : "Still thinking about it? Secure your Boutiq session";

  const itemListHtml = items
    .map(
      item => `
    <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
      <strong>${item.name}</strong> ${item.variant ? `(${item.variant})` : ''} - Qty: ${item.quantity}
    </li>
  `
    )
    .join('');

  const html = `
    <div style="font-family: sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #6366f1; border-radius: 12px;">
      <h1 style="color: #6366f1; font-size: 24px; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">Cart Saved!</h1>
      <p>Hey ${name || 'there'},</p>
      
      <p>${
        hours === 1
          ? "We noticed you left some of our premium medical-grade Boutiq Switch vapes in your e-commerce cart. Don't worry, we're holding onto them for you!"
          : "Items in your cart are highly popular and currently selling fast. Complete your order now to secure your batch before they are completely out of stock!"
      }</p>

      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #6366f1;">Saved Items:</h4>
        <ul style="padding-left: 20px; margin-bottom: 0;">
          ${itemListHtml}
        </ul>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || 'https://boutiqswitchvapes.us'}/checkout" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">
          Complete Checkout Now
        </a>
      </p>

      <div style="background-color: #fef2f2; border: 1px dashed #f87171; padding: 12px; border-radius: 8px; font-size: 12px; text-align: center; margin: 15px 0;">
        <strong>New Customer Bonus:</strong> Use coupon code <strong>WELCOME10</strong> during checkout to save an instant 10% on your first request.
      </div>

      <p style="font-size: 11px; color: #6b7280; margin-top: 35px; text-align: center;">
        Disclaimer: Products contain THC substances. For medical and recreational use. Keep out of reach of children.
      </p>
    </div>
  `;

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Boutiq Switch Cart <orders@boutiqswitchvapes.us>',
        to: email,
        subject,
        html,
      });
    } catch (err) {
      console.error(`Failed to send abandoned cart reminder (${hours}h) through Resend api:`, err);
    }
  } else {
    console.log(`[STUB EMAIL RECOVERY CART SENT to ${email} for ${hours} hours]`);
    console.log(`SUBJECT: ${subject}`);
  }
}
