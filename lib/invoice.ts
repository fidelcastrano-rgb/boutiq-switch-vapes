/**
 * Pure-JS/TS manual PDF binary builder. 
 * Creates a valid PDF stream encapsulating order and billing metrics
 * without requiring external edge-incompatible compiler binaries.
 */
export function generateInvoicePdfBuffer(order: any): Buffer {
  const content: string[] = [];
  content.push('%PDF-1.4');
  
  // 1 0 obj: Catalog
  content.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  
  // 2 0 obj: Pages
  content.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  
  // 3 0 obj: Page 1
  content.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595 842] /Contents 5 0 R >>\nendobj');
  
  // 4 0 obj: Resources
  content.push('4 0 obj\n<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >>\nendobj');
  
  const shortId = order.id.slice(0, 8).toUpperCase();
  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const totalVal = Number(order.total || 0).toFixed(2);
  const paymentMethodStr = order.payment_method || 'Mastercard';
  const shippingMethodStr = order.shipping_method || 'Normal';
  
  // Items parsing
  let itemsList: any[] = [];
  try {
    itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  } catch (e) {
    itemsList = [];
  }

  // Calculate items summary for PDF
  const itemsSummaryStrArr = itemsList.map((itm: any) => {
    const qty = itm.quantity || 1;
    const price = Number(itm.price || 0).toFixed(2);
    return `${itm.name.substring(0, 25)} (x${qty}) - $${price}`;
  });

  // Construct standard stream text inside the PDF matching guidelines
  let streamText = '';
  streamText += 'BT\n';
  streamText += '/F2 20 Tf\n';
  streamText += '50 780 Td\n';
  streamText += '(BOUTIQ SWITCH VAPES) Tj\n';
  
  streamText += '/F1 10 Tf\n';
  streamText += '0 -20 Td\n';
  streamText += '(Premium Authentic Distribution Portal) Tj\n';
  
  streamText += '/F2 14 Tf\n';
  streamText += '0 -40 Td\n';
  streamText += `(INVOICE REFERENCE: #${shortId}) Tj\n`;
  
  streamText += '/F1 11 Tf\n';
  streamText += '0 -30 Td\n';
  streamText += `(Invoice Date: ${dateStr}) Tj\n`;
  streamText += '0 -15 Td\n';
  streamText += `(Recipient: ${order.customer_name || 'Valued Customer'}) Tj\n`;
  streamText += '0 -15 Td\n';
  streamText += `(Email: ${order.customer_email || 'customer@example.com'}) Tj\n`;
  streamText += '0 -15 Td\n';
  streamText += `(Country: ${order.customer_country || 'United States'}) Tj\n`;
  streamText += '0 -15 Td\n';
  streamText += `(Destination: ${order.customer_address || 'N/A'}) Tj\n`;
  
  streamText += '/F2 12 Tf\n';
  streamText += '0 -30 Td\n';
  streamText += '(PURCHASED PRODUCTS) Tj\n';
  
  streamText += '/F1 11 Tf\n';
  for (const sumStr of itemsSummaryStrArr.slice(0, 5)) {
    streamText += '0 -15 Td\n';
    streamText += `(${sumStr}) Tj\n`;
  }
  
  streamText += '/F2 12 Tf\n';
  streamText += '0 -30 Td\n';
  streamText += '(METRIC SUMMARY DETAILS) Tj\n';
  
  streamText += '/F1 11 Tf\n';
  streamText += '0 -20 Td\n';
  streamText += `(Shipping Option: ${shippingMethodStr}) Tj\n`;
  streamText += '0 -15 Td\n';
  streamText += `(Payment Method Selected: ${paymentMethodStr}) Tj\n`;
  
  // Calculate raw subtotal assuming shipping is separate
  let orderSubtotal = Number(order.total || 0);
  let shipCost = 0;
  if (shippingMethodStr === 'Overnight') shipCost = 60;
  else if (shippingMethodStr === 'Express') shipCost = 35;
  else if (shippingMethodStr === 'Normal') shipCost = 20;

  // Derive coupon percent and coupon code
  const couponDiscountVal = Number(order.discount_amount || 0);
  const cryptoDiscountVal = Number(order.crypto_discount || 0);
  const subtotalVal = (orderSubtotal - shipCost + couponDiscountVal + cryptoDiscountVal);

  streamText += '0 -20 Td\n';
  streamText += `(Purchase Subtotal: $${subtotalVal.toFixed(2)}) Tj\n`;
  
  if (order.coupon_code) {
    streamText += '0 -15 Td\n';
    streamText += `(Coupon [${order.coupon_code}]: -$${couponDiscountVal.toFixed(2)}) Tj\n`;
  }
  
  if (cryptoDiscountVal > 0) {
    streamText += '0 -15 Td\n';
    streamText += `(Crypto Discount: -$${cryptoDiscountVal.toFixed(2)}) Tj\n`;
  }
  
  streamText += '0 -15 Td\n';
  streamText += `(Shipping Fee Selected: $${shipCost.toFixed(2)}) Tj\n`;
  
  streamText += '/F2 12 Tf\n';
  streamText += '0 -25 Td\n';
  streamText += `(GRAND FINAL TOTAL: $${totalVal}) Tj\n`;
  
  streamText += '/F1 10 Tf\n';
  streamText += '0 -40 Td\n';
  streamText += '(Instructions regarding payment have been dispatched to your email address.) Tj\n';
  streamText += '0 -15 Td\n';
  streamText += '(Please clear the pending hold within 48 hours to initiate expedited dispatch.) Tj\n';
  streamText += '0 -15 Td\n';
  streamText += '(Thank you for order placement with Boutiq Switch Vapes!) Tj\n';
  
  streamText += 'ET\n';
  
  const streamLength = streamText.length;
  content.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamText}endstream\nendobj`);
  
  // trailer
  content.push('xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000062 00005 n \n0000000123 00005 n \n0000000216 00005 n \n0000000305 00005 n \n');
  content.push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n380\n%%EOF');
  
  return Buffer.from(content.join('\n'));
}

/**
 * Generates an elegantly styled, high-contrast HTML Invoice 
 * complete with corporate logo, meta details and breakdown tables.
 */
export function generateInvoiceHtml(order: any): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString();
  const paymentMethodStr = order.payment_method || 'Mastercard';
  const shippingMethodStr = order.shipping_method || 'Normal';
  
  let itemsList: any[] = [];
  try {
    itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
  } catch (e) {
    itemsList = [];
  }

  // Determine ship cost
  let shipCost = 20;
  if (shippingMethodStr === 'Overnight') shipCost = 60;
  else if (shippingMethodStr === 'Express') shipCost = 35;
  else if (shippingMethodStr === 'Normal') shipCost = 20;

  const couponDiscountVal = Number(order.discount_amount || 0);
  const cryptoDiscountVal = Number(order.crypto_discount || 0);
  const totalVal = Number(order.total || 0);
  const subtotalVal = (totalVal - shipCost + couponDiscountVal + cryptoDiscountVal);

  const itemsRows = itemsList.map((item) => `
    <tr style="border-bottom: 1px solid #27272a;">
      <td style="padding: 12px 0; font-size: 14px; text-align: left; color: #e4e4e7;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px 0; font-size: 14px; text-align: center; color: #a1a1aa;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; font-size: 14px; text-align: right; color: #ffffff; font-family: monospace;">
        $${Number(item.price).toFixed(2)}
      </td>
      <td style="padding: 12px 0; font-size: 14px; text-align: right; color: #ffffff; font-family: monospace;">
        $${(Number(item.price) * Number(item.quantity)).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${shortId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #ffffff; margin: 0; padding: 40px 10px;">
        <div style="max-width: 700px; margin: 0 auto; background-color: #121214; border: 1px solid #1f1f23; border-radius: 24px; padding: 40px; box-sizing: border-box;">
          
          <!-- Corporate branding logo section -->
          <table style="width: 100%; border-bottom: 1px solid #1f1f23; padding-bottom: 24px; margin-bottom: 30px;">
            <tr>
              <td style="text-align: left;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">Boutiq Switch Vapes</h1>
                <p style="margin: 4px 0 0 0; color: #d4af37; font-size: 10px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">Premium Authentic Distribution</p>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <span style="background-color: #d4af37; color: #000000; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">INVOICE OFFICIAL</span>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #71717a; font-family: monospace;">#INV-${shortId}</p>
              </td>
            </tr>
          </table>

          <!-- Customer details metadata billing info -->
          <table style="width: 100%; margin-bottom: 30px; font-size: 13px;">
            <tr>
              <td style="width: 50%; vertical-align: top; text-align: left;">
                <h5 style="margin: 0 0 6px 0; color: #71717a; font-size: 11px; text-transform: uppercase; tracking-wider: 1px;">Billed Recipient:</h5>
                <p style="margin: 0; color: #ffffff; font-weight: bold; font-size: 15px;">${order.customer_name || 'Valued Customer'}</p>
                <p style="margin: 4px 0; color: #a1a1aa; font-family: monospace;">${order.customer_email || 'N/A'}</p>
                <p style="margin: 0; color: #71717a; line-height: 1.4;">${order.customer_address || 'N/A'}</p>
                ${order.customer_country ? `<p style="margin: 4px 0 0 0; color: #d4af37; font-weight: 600;">Country: ${order.customer_country}</p>` : ''}
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <h5 style="margin: 0 0 6px 0; color: #71717a; font-size: 11px; text-transform: uppercase; tracking-wider: 1px;">Summary Date & Terms:</h5>
                <p style="margin: 0; color: #ffffff;"><strong>Issue Date:</strong> ${dateStr}</p>
                <p style="margin: 4px 0 0 0; color: #ffffff;"><strong>Payment Choice:</strong> ${paymentMethodStr}</p>
                <p style="margin: 4px 0 0 0; color: #ffffff;"><strong>Shipping Option:</strong> ${shippingMethodStr}</p>
                <p style="margin: 4px 0 0 0; color: #71717a;"><strong>Due Date:</strong> Immediate Clearance</p>
              </td>
            </tr>
          </table>

          <!-- Line items summary -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #1f1f23; text-align: left;">
                <th style="padding-bottom: 12px; color: #71717a; font-size: 11px; text-transform: uppercase;">Product Name</th>
                <th style="padding-bottom: 12px; color: #71717a; font-size: 11px; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
                <th style="padding-bottom: 12px; color: #71717a; font-size: 11px; text-transform: uppercase; text-align: right; width: 100px;">Price</th>
                <th style="padding-bottom: 12px; color: #71717a; font-size: 11px; text-transform: uppercase; text-align: right; width: 100px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Calculation breakdown side align table -->
          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="width: 50%;"></td>
              <td style="width: 50%; vertical-align: top;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #71717a; text-align: left;">Subtotal:</td>
                    <td style="padding: 6px 0; color: #ffffff; text-align: right; font-family: monospace;">$${subtotalVal.toFixed(2)}</td>
                  </tr>
                  ${order.coupon_code ? `
                    <tr>
                      <td style="padding: 6px 0; color: #71717a; text-align: left;">Discount [${order.coupon_code}]:</td>
                      <td style="padding: 6px 0; color: #f43f5e; text-align: right; font-family: monospace;">-$${couponDiscountVal.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  ${cryptoDiscountVal > 0 ? `
                    <tr>
                      <td style="padding: 6px 0; color: #71717a; text-align: left;">Crypto Discount (10%):</td>
                      <td style="padding: 6px 0; color: #f43f5e; text-align: right; font-family: monospace;">-$${cryptoDiscountVal.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 6px 0; color: #71717a; text-align: left;">Shipping (${shippingMethodStr}):</td>
                    <td style="padding: 6px 0; color: #ffffff; text-align: right; font-family: monospace;">$${shipCost.toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 1px solid #1f1f23;">
                    <td style="padding: 12px 0 0 0; color: #ffffff; font-weight: bold; text-align: left; font-size: 16px;">Final Total:</td>
                    <td style="padding: 12px 0 0 0; color: #d4af37; font-weight: 800; text-align: right; font-size: 18px; font-family: monospace;">$${totalVal.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Bottom compliance notice line -->
          <div style="border-top: 1px solid #1f1f23; padding-top: 24px; margin-top: 40px; text-align: center; font-size: 11px; color: #71717a; font-family: sans-serif;">
            <p style="margin: 0 0 4px 0;">This invoice documents premium authentic distribution checkouts.</p>
            <p style="margin: 0;">Need immediate live support? Reply directly to this email or drop a line of note to support-order@boutiqvapes.us</p>
          </div>

        </div>
      </body>
    </html>
  `;
}
