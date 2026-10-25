import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

function getEmailCredentials() {
  const user = process.env.EMAIL_USER || 'axminprana@gmail.com';
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  const adminEmail = process.env.ADMIN_EMAIL || 'axminprana@gmail.com';
  return { user, pass, adminEmail };
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'axminprana@gmail.com';

let cachedTransporter: Transporter | null = null;

function getTransporter() {
  const { user, pass } = getEmailCredentials();
  if (!pass) return null;
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }
  return cachedTransporter;
}

function getGoogleScriptUrl(): string | null {
  return (
    process.env.MAIL_SCRIPT_URL ||
    process.env.GOOGLE_SCRIPT_URL ||
    process.env.EMAIL_SCRIPT_URL ||
    process.env.OTP_SCRIPT_URL ||
    'https://script.google.com/macros/s/AKfycby9HSlfYDkwmhChVmGO5G11P4Kftc6DqZSbiuz0SUj9VO-AXSwkvdhq5AMd10MCSrru6g/exec'
  );
}

/**
 * Dispatch email via Google Apps Script Web App (High-reliability HTTP delivery)
 */
export async function sendViaGoogleScript(payload: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  otp?: string;
}) {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) return { success: false, error: 'No Google Script URL configured' };

  try {
    const plainText =
      payload.text || (payload.html ? payload.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '');

    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.to,
        email: payload.to,
        recipient: payload.to,
        subject: payload.subject,
        otp: payload.otp || '',
        code: payload.otp || '',
        html: payload.html || '',
        htmlBody: payload.html || '',
        body: plainText,
        message: plainText || payload.otp || '',
      }),
      redirect: 'follow',
    });

    const responseText = await res.text();
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.warn(`[Google Apps Script Warning] Endpoint returned HTML error page instead of JSON. Check script deployment permissions.`);
      return { success: false, error: 'Google Apps Script returned an HTML error' };
    }
    console.log(`[Google Apps Script] Dispatched to ${payload.to}:`, responseText);
    return { success: true, via: 'google_script', response: responseText };
  } catch (error: any) {
    console.error(`[Google Apps Script Error] Failed to send to ${payload.to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to send email safely with dual-transport reliability:
 * 1. Nodemailer SMTP (Direct Gmail SMTP with App Password)
 * 2. Google Apps Script Web App (High-reliability HTTP delivery)
 */
async function sendMailSafe(options: SendMailOptions, otpCode?: string) {
  const { user, pass } = getEmailCredentials();
  const mailOptions = {
    from: `"Axmin Prana Ayurveda" <${user}>`,
    ...options,
  };

  const recipient = String(mailOptions.to || '');
  const subject = String(mailOptions.subject || 'Axmin Prana Ayurveda Notification');
  const htmlContent = String(mailOptions.html || '');
  const textContent = String(mailOptions.text || '');

  console.log(`[Email Dispatch] Sending to: ${recipient} | Subject: ${subject}`);
  if (otpCode) {
    console.log(`========================================`);
    console.log(`[AUTH OTP DISPATCH] Recipient: ${recipient}`);
    console.log(`[AUTH OTP CODE] ===> ${otpCode} <===`);
    console.log(`========================================`);
  }

  let lastError = '';

  // 1. Direct Gmail SMTP (Nodemailer with Google App Password)
  const transporter = getTransporter();
  if (pass && transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Nodemailer SMTP] Email sent successfully to ${mailOptions.to}: ${info.messageId}`);
      return { success: true, via: 'smtp', messageId: info.messageId };
    } catch (error: any) {
      console.error(`[Nodemailer SMTP Error] Failed to send email to ${mailOptions.to}:`, error.message);
      lastError = error.message;
    }
  }

  // 2. Fallback to Google Apps Script Web App
  const scriptUrl = getGoogleScriptUrl();
  if (scriptUrl) {
    try {
      const scriptResult = await sendViaGoogleScript({
        to: recipient,
        subject,
        html: htmlContent,
        text: textContent,
        otp: otpCode,
      });
      if (scriptResult.success) {
        return scriptResult;
      }
    } catch (scriptErr: any) {
      console.error(`[Google Apps Script Error]:`, scriptErr.message);
      if (!lastError) lastError = scriptErr.message;
    }
  }

  // If credentials not set
  if (!pass && !scriptUrl) {
    console.log(`[Nodemailer Notice] Email sending simulated (EMAIL_PASS not set in .env):`);
    console.log(`  To: ${mailOptions.to}`);
    console.log(`  Subject: ${mailOptions.subject}`);
    return { simulated: true, success: true };
  }

  return { success: false, error: lastError || 'Failed to dispatch email' };
}

/**
 * Send Welcome Email upon customer registration
 */
export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF8F1; padding: 30px; border-radius: 12px; border: 1px solid #E5E8E0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #214E34; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Axmin Prana</h1>
        <p style="color: #B86F4B; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 4px;">Classical Ayurvedic Formulations</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #E5E8E0;">
        <h2 style="color: #214E34; font-size: 18px; margin-top: 0;">Namaste, ${user.name}!</h2>
        <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
          Welcome to the <strong>Axmin Prana</strong> wellness family. Your account has been registered successfully.
        </p>
        <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
          Explore our range of classical churnas, tailams, rasayanas, and wellness capsules prepared in strict accordance with classical Samhitas.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://axminprana.com'}/shop" style="background: #214E34; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block;">
            Explore Ayurvedic Formulations
          </a>
        </div>
        <p style="color: #718096; font-size: 12px; margin-bottom: 0;">
          If you have any questions, our Vaidya consultation desk is reachable at <a href="mailto:${ADMIN_EMAIL}" style="color: #214E34;">${ADMIN_EMAIL}</a>.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #A0AEC0;">
        © ${new Date().getFullYear()} Axmin Prana Ayurveda. All rights reserved.
      </div>
    </div>
  `;

  return sendMailSafe({
    to: user.email,
    subject: 'Welcome to Axmin Prana | Authentic Ayurvedic Wellness',
    html,
  });
}

/**
 * Send Order Confirmation Email to Customer & Notification to Store Admin
 */
export async function sendOrderConfirmationEmail(order: any) {
  const itemsHtml = order.items
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E5E8E0; font-size: 13px; color: #2D3748;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 11px; color: #718096;">${item.packSize || ''} (Qty: ${item.quantity})</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E8E0; font-size: 13px; color: #214E34; font-weight: bold; text-align: right;">
          ₹${item.total || item.price * item.quantity}
        </td>
      </tr>
    `
    )
    .join('');

  const customerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF8F1; padding: 30px; border-radius: 12px; border: 1px solid #E5E8E0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #214E34; margin: 0; font-size: 26px; font-weight: 700;">Axmin Prana</h1>
        <p style="color: #B86F4B; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 4px;">Order Confirmation #${order.orderNumber}</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #E5E8E0;">
        <h2 style="color: #214E34; font-size: 18px; margin-top: 0;">Thank You for Your Order!</h2>
        <p style="color: #4A5568; font-size: 14px; line-height: 1.6;">
          Your order has been received and our dispensary team is preparing your classical preparations with care.
        </p>

        <div style="background: #FAF8F1; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
          <div><strong>Order Number:</strong> ${order.orderNumber}</div>
          <div><strong>Order Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}</div>
          <div><strong>Payment Method:</strong> ${order.paymentMethod?.toUpperCase()} (${order.paymentStatus})</div>
        </div>

        <h3 style="color: #214E34; font-size: 14px; margin-top: 20px; border-bottom: 2px solid #214E34; padding-bottom: 6px;">Consignment Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          ${itemsHtml}
        </table>

        <div style="margin-top: 16px; text-align: right; font-size: 14px;">
          <div>Subtotal: <strong>₹${order.subtotal}</strong></div>
          ${order.discountAmount ? `<div style="color: #B86F4B;">Discount: <strong>-₹${order.discountAmount}</strong></div>` : ''}
          <div>Shipping: <strong>₹${order.shippingFee || 0}</strong></div>
          <div style="font-size: 18px; color: #214E34; font-weight: bold; margin-top: 8px;">Total: ₹${order.totalAmount}</div>
        </div>

        <h3 style="color: #214E34; font-size: 14px; margin-top: 24px; border-bottom: 1px solid #E5E8E0; padding-bottom: 6px;">Delivery Address</h3>
        <p style="color: #4A5568; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          <strong>${order.shippingAddress.fullName}</strong><br/>
          ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br/>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br/>
          Phone: ${order.shippingAddress.phone}
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #A0AEC0;">
        For questions or tracking assistance, contact <a href="mailto:${ADMIN_EMAIL}" style="color: #214E34;">${ADMIN_EMAIL}</a>.
      </div>
    </div>
  `;

  // Send to Customer
  const customerEmail = order.shippingAddress?.email || (order.user && order.user.email);
  if (customerEmail) {
    await sendMailSafe({
      to: customerEmail,
      subject: `Order Confirmed #${order.orderNumber} - Axmin Prana Ayurveda`,
      html: customerHtml,
    });
  }

  // Also notify Admin at axminprana@gmail.com
  const adminHtml = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>New Order Placed: #${order.orderNumber}</h2>
      <p><strong>Customer:</strong> ${order.shippingAddress.fullName} (${customerEmail || 'Guest'})</p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount} (${order.paymentMethod} - ${order.paymentStatus})</p>
      <p><strong>Items Count:</strong> ${order.items.length}</p>
      <p><strong>Shipping City:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.state}</p>
      <a href="${process.env.FRONTEND_URL || 'https://axminprana.com'}/admin" style="background: #214E34; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Admin Panel</a>
    </div>
  `;

  await sendMailSafe({
    to: ADMIN_EMAIL,
    subject: `[ADMIN ALERT] New Order Received #${order.orderNumber} (₹${order.totalAmount})`,
    html: adminHtml,
  });
}

/**
 * Send Bulk / B2B Enquiry Alert to axminprana@gmail.com
 */
export async function sendEnquiryNotificationEmail(enquiry: any) {
  const adminHtml = `
    <div style="font-family: sans-serif; padding: 20px; background: #FAF8F1; border-radius: 8px;">
      <h2 style="color: #214E34;">New B2B / Bulk Wholesale Enquiry</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px; font-weight: bold;">Name:</td><td>${enquiry.name}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Company:</td><td>${enquiry.company}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Email:</td><td><a href="mailto:${enquiry.email}">${enquiry.email}</a></td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Phone:</td><td>${enquiry.phone}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Business Type:</td><td>${enquiry.businessType}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Product Interest:</td><td>${enquiry.productInterest}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Quantity:</td><td>${enquiry.quantity}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Message:</td><td>${enquiry.message || 'None provided'}</td></tr>
      </table>
    </div>
  `;

  await sendMailSafe({
    to: ADMIN_EMAIL,
    subject: `[B2B ENQUIRY] ${enquiry.company} - ${enquiry.productInterest}`,
    html: adminHtml,
  });

  // Acknowledgment to the sender
  if (enquiry.email) {
    const customerAck = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #FAF8F1; border-radius: 8px;">
        <h2 style="color: #214E34;">Thank you for your bulk enquiry, ${enquiry.name}</h2>
        <p>We have received your commercial wholesale interest regarding <strong>${enquiry.productInterest}</strong>.</p>
        <p>Our Ayurvedic B2B operations team will evaluate your formulation requirements and contact you within 24 business hours.</p>
        <p style="font-size: 12px; color: #718096;">Axmin Prana Ayurveda Wholesale Desk • ${ADMIN_EMAIL}</p>
      </div>
    `;
    await sendMailSafe({
      to: enquiry.email,
      subject: `Enquiry Received: ${enquiry.productInterest} - Axmin Prana Ayurveda`,
      html: customerAck,
    });
  }
}

/**
 * Send Out of Stock / Low Stock Alert to Admin
 */
export async function sendStockAlertEmail(product: any) {
  const isZero = product.stock <= 0;
  const adminHtml = `
    <div style="font-family: sans-serif; padding: 20px; background: ${isZero ? '#FFF5F5' : '#FFFDF5'}; border: 1px solid ${isZero ? '#FEB2B2' : '#FBD38D'}; border-radius: 8px;">
      <h2 style="color: ${isZero ? '#C53030' : '#C05621'};">${isZero ? 'CRITICAL: Product Out of Stock' : 'Dispensary Low Stock Warning'}</h2>
      <p><strong>Formulation:</strong> ${product.name}</p>
      <p><strong>SKU:</strong> ${product.sku}</p>
      <p><strong>Current Dispensary Stock:</strong> <span style="font-size: 18px; font-weight: bold; color: ${isZero ? '#C53030' : '#C05621'};">${product.stock} units</span></p>
      <p>Please update or replenish dispensary inventory via the Axmin Prana Admin Console.</p>
      <a href="${process.env.FRONTEND_URL || 'https://axminprana.com'}/admin" style="background: #214E34; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Manage Inventory</a>
    </div>
  `;

  await sendMailSafe({
    to: ADMIN_EMAIL,
    subject: `[STOCK ALERT] ${isZero ? 'OUT OF STOCK' : 'LOW STOCK'}: ${product.name} (${product.stock} units left)`,
    html: adminHtml,
  });
}

/**
 * Send OTP Verification Email for Secure Login
 */
export async function sendOtpEmail(email: string, otp: string, name?: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #FAF8F1; padding: 32px; border-radius: 12px; border: 1px solid #E5E8E0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #214E34; margin: 0; font-size: 24px; font-weight: 700;">Axmin Prana</h1>
        <p style="color: #B86F4B; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 4px;">Authentication Verification</p>
      </div>

      <div style="background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #E5E8E0; text-align: center;">
        <h2 style="color: #214E34; font-size: 18px; margin-top: 0;">Namaste ${name ? name : ''}</h2>
        <p style="color: #4A5568; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          Use the following 6-digit One-Time Password (OTP) to securely sign in to your Axmin Prana account:
        </p>

        <div style="background: #FAF8F1; border: 2px dashed #214E34; border-radius: 8px; padding: 16px; margin: 20px 0; display: inline-block;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #214E34;">${otp}</span>
        </div>

        <p style="color: #718096; font-size: 12px; margin-top: 16px;">
          ⏳ This verification code will expire in <strong>10 minutes</strong>.
        </p>
        <p style="color: #A0AEC0; font-size: 11px; margin-bottom: 0;">
          If you did not request this login code, please ignore this email or contact support at <a href="mailto:${ADMIN_EMAIL}" style="color: #214E34;">${ADMIN_EMAIL}</a>.
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #A0AEC0;">
        © ${new Date().getFullYear()} Axmin Prana Ayurveda. All rights reserved.
      </div>
    </div>
  `;

  return sendMailSafe(
    {
      to: email,
      subject: `Your Axmin Prana Login Verification Code: ${otp}`,
      html,
      text: `Namaste ${name || ''},\n\nYour Axmin Prana login verification code is: ${otp}\n\nThis verification code will expire in 10 minutes.\n\n© ${new Date().getFullYear()} Axmin Prana Ayurveda.`,
    },
    otp
  );
}

