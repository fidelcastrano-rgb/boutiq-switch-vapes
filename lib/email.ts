import { Resend } from 'resend';

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

interface SendEmailParams {
  to: string;
  orderId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

/**
 * Delivers payment instructions via Resend if configured, logging simulated attempts otherwise.
 */
export async function sendPaymentInstructions({
  to,
  orderId,
  customerName,
  items,
  total,
}: SendEmailParams) {
  const shortOrderId = orderId.substring(0, 8).toUpperCase();
  const subject = `📥 Action Required: Payment Instructions for Order #${shortOrderId}`;
  
  // Format items list for HTML
  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 0; color: #e4e4e7; font-size: 14px;">
          <strong>${item.name}</strong> <span style="color: #71717a; font-size: 12px;">× ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; color: #ffffff; text-align: right; font-family: monospace; font-size: 14px;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Mastercard Checkout Instructions</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #121214; border: 1px solid #1f1f23; border-radius: 24px; padding: 40px; box-sizing: border-box;">
          
          <!-- Header Branding -->
          <div style="border-b: 1px solid #1f1f23; padding-bottom: 24px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: -0.5px;">Boutiq Switch Vapes</h1>
            <p style="color: #d4af37; font-size: 10px; font-weight: bold; letter-spacing: 2px; margin: 4px 0 0 0; text-transform: uppercase;">Premium Authentic Distribution</p>
          </div>

          <!-- Greeting -->
          <div style="margin-bottom: 24px;">
            <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 8px 0;">Hello ${customerName},</p>
            <p style="color: #a1a1aa; font-size: 15px; line-height: 1.5; margin: 0;">
              Thank you for ordering with Boutiq Switch Vapes! Your checkout was successfully submitted. Since you are paying via <strong>Mastercard</strong>, please follow the payment completion instructions outlined below.
            </p>
          </div>

          <!-- Order Summary Card -->
          <div style="background-color: #181c20; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #27272a; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: bold;">Order Reference</span>
              <span style="color: #d4af37; font-size: 12px; font-family: monospace; font-weight: bold;">#${shortOrderId}</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #27272a;">
                  <th style="text-align: left; color: #71717a; font-size: 11px; text-transform: uppercase; padding-bottom: 8px;">Item</th>
                  <th style="text-align: right; color: #71717a; font-size: 11px; text-transform: uppercase; padding-bottom: 8px;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="padding-top: 16px; margin-top: 8px; border-top: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #ffffff; font-size: 14px; font-weight: bold;">Total Amount Duet</span>
              <span style="color: #d4af37; font-size: 18px; font-family: monospace; font-weight: 800;">$${total.toFixed(2)}</span>
            </div>
          </div>

          <!-- PAYMENT INSTRUCTIONS PANEL -->
          <div style="border-left: 3px solid #d4af37; padding-left: 16px; margin-bottom: 30px;">
            <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 8px 0; font-weight: bold;">Mastercard Processing Steps</h3>
            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
              Your order is currently placed on <strong>Pending Payment</strong> status. To finalize the transfer, please complete your secure clearing using one of these options:
            </p>
            <ol style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 6px;">Check your sms or secure banking app notification to verify and authorize the pre-authorisation hold from our clearing merchant.</li>
              <li style="margin-bottom: 6px;">Or, reply directly to this mail with your order reference ID so an agent can provide a manual click-to-pay link.</li>
              <li style="margin-bottom: 6px;">Once cleared, your order moves to "Paid" and ships with priority tracking details!</li>
            </ol>
          </div>

          <!-- Info Footer Box -->
          <div style="text-align: center; border-top: 1px solid #1f1f23; padding-top: 24px; margin-top: 24px; color: #71717a; font-size: 11px;">
            <p style="margin: 0 0 4px 0;">Need prompt assistance? Message us at support-order@boutiqvapes.us</p>
            <p style="margin: 0;">© 2026 Boutiq Switch Vapes. All rights reserved.</p>
          </div>

        </div>
      </body>
    </html>
  `;

  const resend = getResend();
  let liveDispatched = false;
  let apiResponse = null;

  if (resend) {
    try {
      // Free tier warning: sandbox can only deliver to the account owner (yamahaoutboardss@gmail.com)
      // and must send from 'onboarding@resend.dev'
      const data = await resend.emails.send({
        from: 'Boutiq Switch Vapes <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      apiResponse = data;
      liveDispatched = true;
      console.log('Successfully dispatched live Resend email confirmation:', data);
    } catch (apiError: any) {
      console.error('Failed delivering email via Resend API, falling back to sandbox simulator:', apiError);
      apiResponse = { error: apiError.message };
    }
  } else {
    console.log('Resend client is currently unconfigured (No RESEND_API_KEY environment variable detected). Simulating checkout instructions delivery.');
  }

  // Create virtual dispatch logging info
  const dispatchLog = {
    id: 'dispatch_' + Math.random().toString(36).substring(2, 10),
    orderId,
    customerEmail: to,
    timestamp: new Date().toISOString(),
    subject,
    message: `Thank you for your order. Mastercard payment instructions have been sent for Order #${shortOrderId}. Please follow the instructions provided to complete payment.`,
    isLive: liveDispatched,
    resendResponse: apiResponse ? JSON.stringify(apiResponse) : 'Simulated'
  };

  // Persist dispatch in-memory logs
  if (!(globalThis as any)._inMemoryEmailDispatchLogs) {
    (globalThis as any).__inMemoryEmailDispatchLogs = [];
  }
  (globalThis as any).__inMemoryEmailDispatchLogs.push(dispatchLog);

  return dispatchLog;
}
