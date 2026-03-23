import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Determine which email service to use
const useService = String(process.env.EMAIL_SERVICE || 'sendgrid').toLowerCase();
const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY);
const hasBrevo = Boolean(process.env.BREVO_API_KEY);
const isSendGrid = useService === 'sendgrid' && hasSendGrid;
const isBrevo = useService === 'brevo' && hasBrevo;

if (isSendGrid) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid email service initialized');
} else if (isBrevo) {
  console.log('✅ Brevo email service initialized');
} else {
    console.log('ℹ️ Using Nodemailer for email service');
}

const sendViaBrevo = async ({ to, from, subject, html, text }) => {
  const senderName = process.env.MAIL_FROM_NAME || 'Wearhouse Thrift';
  const replyToEmail = (process.env.MAIL_REPLY_TO || '').trim();
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: from, name: senderName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      replyTo: replyToEmail ? { email: replyToEmail, name: senderName } : undefined,
    }),
  });

  if (!response.ok) {
    let details = '';
    try {
      const body = await response.json();
      details = body?.message || body?.code || '';
    } catch {
      details = '';
    }
    throw new Error(`Brevo API error (${response.status})${details ? `: ${details}` : ''}`);
  }

  const payload = await response.json().catch(() => ({}));
  return { sent: true, messageId: payload?.messageId || 'brevo-sent' };
};

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `INR ${amount.toFixed(2)}`;
};

const getTrackOrderUrl = (order) => {
  const base = 'https://wearhousethrift.netlify.app/track-order';
  const params = new URLSearchParams();
  if (order?.id) params.set('order_id', String(order.id));
  if (order?.phone) params.set('phone', String(order.phone));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
};

const buildOrderEmailHtml = (order) => {
    const trackUrl = getTrackOrderUrl(order);
    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:Arial,Helvetica,sans-serif;color:#10131a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dfe3ea;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:0;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:24px 24px 20px;">
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;color:#cbd5e1;text-transform:uppercase;">Wearhouse Thrift</p>
                    <h1 style="margin:0;font-size:24px;line-height:1.2;color:#ffffff;">Order Confirmed</h1>
                    <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#dbe3f0;">Thanks for your order. We have received your payment and your order is now in process.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px 8px;">
              <p style="margin:0 0 8px;font-size:15px;color:#0f172a;">Hi ${order.customer_name || 'Customer'},</p>
              <p style="margin:0;font-size:14px;line-height:1.65;color:#475569;">Your order has been placed successfully. You can track your order from here using the button below.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Order ID</td>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#111827;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Order Date</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${new Date(order.created_at || Date.now()).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Status</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${order.order_status || 'New Order'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:16px 24px 18px;">
              <a href="${trackUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:0.03em;">Track Your Order</a>
              <p style="margin:10px 0 0;font-size:12px;color:#64748b;">You can track your order from here: <a href="${trackUrl}" style="color:#1d4ed8;text-decoration:underline;">${trackUrl}</a></p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 8px;">
              <h2 style="margin:0 0 10px;font-size:15px;color:#0f172a;">Product Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Product</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${order.product_name || 'Product'}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Quantity</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${order.quantity || 1}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Amount Paid</td>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#111827;">${formatCurrency(order.order_value)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Payment ID</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${order.payment_id || 'N/A'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:10px 24px 24px;">
              <h2 style="margin:0 0 10px;font-size:15px;color:#0f172a;">Delivery Details</h2>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#334155;">${order.full_address || '-'}</p>

              <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#475569;">
                Need help? Reply to this email and our team will assist you.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              WHT Operations | This is an automated order confirmation email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const isMailerConfigured = () => {
  // API providers
  if (hasSendGrid || hasBrevo) return true;
    // Otherwise require SMTP credentials for Nodemailer
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
};

const getFromAddress = () => {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'payments.wht@gmail.com';
};

const getSenderIdentity = () => {
  return {
    email: getFromAddress(),
    name: process.env.MAIL_FROM_NAME || 'Wearhouse Thrift',
  };
};

const getReplyToIdentity = () => {
  const replyTo = (process.env.MAIL_REPLY_TO || '').trim();
  if (!replyTo) return undefined;
  return {
    email: replyTo,
    name: process.env.MAIL_FROM_NAME || 'Wearhouse Thrift',
  };
};

const getSendGridTrackingSettings = () => ({
  clickTracking: { enable: false, enableText: false },
  openTracking: { enable: false },
});

const getTransportConfig = () => {
  // For Render, use Gmail service instead of manual config for better compatibility
  const isRender = process.env.RENDER === 'true';
  
  if (isRender) {
    // Nodemailer's Gmail service automatically handles host/port/secure
    return { service: 'gmail' };
  }
  
  // Manual configuration (for local dev)
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
  };
};

const createTransporter = () => {
    const transportConfig = getTransportConfig();
    
    // Validate credentials before creating transporter
    if (!process.env.SMTP_USER) {
        console.error('❌ SMTP_USER is not set. Email sending will not work.');
    }
    if (!process.env.SMTP_PASS) {
        console.error('❌ SMTP_PASS is not set. Email sending will not work.');
    }
    
    return nodemailer.createTransport({
        ...transportConfig,
        connectionTimeout: 5000,
        socketTimeout: 5000,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const buildOrderStatusEmailHtml = (order, status) => {
    const statusMessages = {
      Packed: 'Good news. Your order has been packed and is ready for dispatch.',
      'Out for Delivery': 'Your order is now out for delivery and will reach you soon.',
      Delivered: 'Your order has been delivered successfully. We hope you love it.',
    };
    const statusMessage = statusMessages[status] || `Your order status is now ${status}.`;
    const trackUrl = getTrackOrderUrl(order);

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order Update</title>
</head>
<body style="margin:0;padding:0;background:#f2f4f8;font-family:Arial,Helvetica,sans-serif;color:#10131a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dfe3ea;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;color:#cbd5e1;text-transform:uppercase;">Wearhouse Thrift</p>
              <h1 style="margin:0;font-size:22px;color:#ffffff;">Order Status Update</h1>
              <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#dbe3f0;">${statusMessage}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:14px;color:#111827;">Hi ${order.customer_name || 'Customer'},</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#475569;">You can track your order from here: <a href="${trackUrl}" style="color:#1d4ed8;text-decoration:underline;">Track Order</a></p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
                <tr>
                  <td>
                    <a href="${trackUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:13px;font-weight:700;">Track Your Order</a>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Order ID</td>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#111827;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Current Status</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${status}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Product</td>
                  <td style="padding:12px 14px;font-size:13px;color:#111827;">${order.product_name || 'Product'}</td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;background:#f8fafc;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Amount Paid</td>
                  <td style="padding:12px 14px;font-size:13px;font-weight:700;color:#111827;">${formatCurrency(order.order_value)}</td>
                </tr>
              </table>

              <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#475569;">
                Thank you for shopping with WHT.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

export const sendOrderConfirmationEmail = async (order) => {
    if (!order?.email) {
        console.warn('⚠️ Order email is missing. Email sending skipped.');
        return { skipped: true, reason: 'missing-recipient' };
    }
    
    if (!isMailerConfigured() && !isSendGrid) {
        console.warn('⚠️ Email credentials not configured in environment. Email sending skipped.');
        return { skipped: true, reason: 'missing-smtp-config' };
    }

    try {
        console.log(`📧 Sending order confirmation email to ${order.email}...`);
        const fromAddress = getFromAddress();
        const senderIdentity = getSenderIdentity();
        const replyToIdentity = getReplyToIdentity();
        const subject = `Order Received - #${order.id}`;
        const html = buildOrderEmailHtml(order);
      const text = `Order Received - #${order.id}\n\nHi ${order.customer_name || 'Customer'}, your order has been received successfully.`;
        
      // Preferred provider: SendGrid
      if (isSendGrid) {
        try {
          const msg = {
            to: order.email,
            from: senderIdentity,
            replyTo: replyToIdentity,
            subject,
            html,
            text,
            trackingSettings: getSendGridTrackingSettings(),
          };
          const response = await sgMail.send(msg);
          const messageId = response[0]?.messageId || response[0]?.headers?.['x-message-id'] || 'unknown';
          console.log(`✅ Order confirmation email sent via SendGrid to ${order.email}. Message ID: ${messageId}`);
          return { sent: true, messageId, provider: 'sendgrid' };
        } catch (sgErr) {
          console.error(`❌ SendGrid failed for ${order.email}:`, sgErr?.message || sgErr);
          if (!hasBrevo && !(process.env.SMTP_USER && process.env.SMTP_PASS)) throw sgErr;
        }
      }

      // Preferred provider: Brevo
      if (isBrevo || (!isSendGrid && hasBrevo)) {
        try {
          const result = await sendViaBrevo({ to: order.email, from: fromAddress, subject, html, text });
          console.log(`✅ Order confirmation email sent via Brevo to ${order.email}. Message ID: ${result.messageId}`);
          return { ...result, provider: 'brevo' };
        } catch (brErr) {
          console.error(`❌ Brevo failed for ${order.email}:`, brErr?.message || brErr);
          if (!(process.env.SMTP_USER && process.env.SMTP_PASS)) throw brErr;
        }
        }
        
      // Last fallback: Nodemailer
        const transporter = createTransporter();
        const sendPromise = transporter.sendMail({
            from: `WHT Payments <${fromAddress}>`,
            to: order.email,
            subject,
            html,
        text,
        });
        
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Send email timeout (exceeded 10 seconds)')), 10000)
        );
        
        const info = await Promise.race([sendPromise, timeoutPromise]);
        console.log(`✅ Order confirmation email sent via Nodemailer to ${order.email}. Message ID: ${info.messageId}`);
        return { sent: true, messageId: info.messageId, provider: 'nodemailer' };
    } catch (error) {
        console.error(`❌ Failed to send order confirmation email to ${order.email}:`, error.code || error.message);
        throw error;
    }
};

export const sendOrderStatusUpdateEmail = async (order, status) => {
  if (!order?.email) {
    console.warn('⚠️ Order email is missing. Email sending skipped.');
    return { skipped: true, reason: 'missing-recipient' };
  }
  
  if (!['Packed', 'Out for Delivery', 'Delivered'].includes(status)) {
    console.warn(`⚠️ Status "${status}" is not supported for email notifications.`);
    return { skipped: true, reason: 'status-not-supported' };
  }
  
  if (!isMailerConfigured() && !isSendGrid) {
    console.warn('⚠️ Email credentials not configured in environment. Email sending skipped.');
    return { skipped: true, reason: 'missing-smtp-config' };
  }

  try {
    const fromAddress = getFromAddress();
    const senderIdentity = getSenderIdentity();
    const replyToIdentity = getReplyToIdentity();
    const subject = `Order #${order.id} Update - ${status}`;
    const html = buildOrderStatusEmailHtml(order, status);
    const text = `Order #${order.id} Update - ${status}\n\nHi ${order.customer_name || 'Customer'}, your order status is now ${status}.`;
    
    console.log(`📧 Sending status update email to ${order.email} (Order #${order.id}: ${status})...`);
    
    // Preferred provider: SendGrid
    if (isSendGrid) {
      try {
        const msg = {
          to: order.email,
          from: senderIdentity,
          replyTo: replyToIdentity,
          subject,
          html,
          text,
          trackingSettings: getSendGridTrackingSettings(),
        };
        const response = await sgMail.send(msg);
        const messageId = response[0]?.messageId || response[0]?.headers?.['x-message-id'] || 'unknown';
        console.log(`✅ Status update email sent via SendGrid to ${order.email}. Message ID: ${messageId}`);
        return { sent: true, messageId, provider: 'sendgrid' };
      } catch (sgErr) {
        console.error(`❌ SendGrid status email failed for ${order.email}:`, sgErr?.message || sgErr);
        if (!hasBrevo && !(process.env.SMTP_USER && process.env.SMTP_PASS)) throw sgErr;
      }
    }

    // Preferred provider: Brevo
    if (isBrevo || (!isSendGrid && hasBrevo)) {
      try {
        const result = await sendViaBrevo({ to: order.email, from: fromAddress, subject, html, text });
        console.log(`✅ Status update email sent via Brevo to ${order.email}. Message ID: ${result.messageId}`);
        return { ...result, provider: 'brevo' };
      } catch (brErr) {
        console.error(`❌ Brevo status email failed for ${order.email}:`, brErr?.message || brErr);
        if (!(process.env.SMTP_USER && process.env.SMTP_PASS)) throw brErr;
      }
    }
    
    // Last fallback: Nodemailer
    const transporter = createTransporter();
    const sendPromise = transporter.sendMail({
      from: `WHT Payments <${fromAddress}>`,
      to: order.email,
      subject,
      html,
      text,
    });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Send email timeout (exceeded 10 seconds)')), 10000)
    );
    
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Status update email sent via Nodemailer to ${order.email}. Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId, provider: 'nodemailer' };
  } catch (error) {
    console.error(`❌ Failed to send status update email to ${order.email}:`, error.code || error.message);
    throw error;
  }
};

export const getMailerHealth = () => {
  const transportConfig = getTransportConfig();
  const configured = isMailerConfigured();
  
  if (!configured) {
    console.warn('⚠️ Mailer not configured: Missing SMTP_USER or SMTP_PASS environment variables');
  }
  
  return {
    status: configured ? 'online' : 'warning',
    configured,
    service: useService,
    providers: {
      sendgrid: hasSendGrid,
      brevo: hasBrevo,
      smtp: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    },
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    from: getFromAddress(),
    credentialsSet: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  };
};
