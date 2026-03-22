import nodemailer from 'nodemailer';

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `INR ${amount.toFixed(2)}`;
};

const buildOrderEmailHtml = (order) => {
    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:22px 24px;border-bottom:1px solid #eaeaea;">
              <h1 style="margin:0;font-size:20px;letter-spacing:0.08em;">WHT</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#555;">Thank you for buying from WHT.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:14px;">Hi ${order.customer_name || 'Customer'},</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">
                Your order has been received successfully. We will start processing it shortly.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ececec;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Order ID</td>
                  <td style="padding:10px 12px;font-size:13px;font-weight:600;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Order Date</td>
                  <td style="padding:10px 12px;font-size:13px;">${new Date(order.created_at || Date.now()).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Status</td>
                  <td style="padding:10px 12px;font-size:13px;">${order.order_status || 'New Order'}</td>
                </tr>
              </table>

              <h2 style="margin:20px 0 10px;font-size:15px;">Product Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ececec;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Product</td>
                  <td style="padding:10px 12px;font-size:13px;">${order.product_name || 'Product'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Quantity</td>
                  <td style="padding:10px 12px;font-size:13px;">${order.quantity || 1}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Amount Paid</td>
                  <td style="padding:10px 12px;font-size:13px;font-weight:600;">${formatCurrency(order.order_value)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Payment ID</td>
                  <td style="padding:10px 12px;font-size:13px;">${order.payment_id || 'N/A'}</td>
                </tr>
              </table>

              <h2 style="margin:20px 0 10px;font-size:15px;">Delivery Details</h2>
              <p style="margin:0;font-size:13px;line-height:1.6;">${order.full_address || '-'}</p>

              <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#444;">
                Need help? Reply to this email and our team will assist you.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 24px;background:#fafafa;border-top:1px solid #ececec;font-size:12px;color:#666;">
              WHT Operations • This is an automated order confirmation email.
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
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
};

const getFromAddress = () => {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'payments.wht@gmail.com';
};

const getTransportConfig = () => {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') !== 'false',
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

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order Update</title>
</head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e5e5;">
          <tr>
            <td style="padding:22px 24px;border-bottom:1px solid #eaeaea;">
              <h1 style="margin:0;font-size:20px;letter-spacing:0.08em;">WHT</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#555;">Order Status Update</p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:14px;">Hi ${order.customer_name || 'Customer'},</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${statusMessage}</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ececec;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Order ID</td>
                  <td style="padding:10px 12px;font-size:13px;font-weight:600;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Current Status</td>
                  <td style="padding:10px 12px;font-size:13px;">${status}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Product</td>
                  <td style="padding:10px 12px;font-size:13px;">${order.product_name || 'Product'}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#fafafa;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Amount Paid</td>
                  <td style="padding:10px 12px;font-size:13px;font-weight:600;">${formatCurrency(order.order_value)}</td>
                </tr>
              </table>

              <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#444;">
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
    
    if (!isMailerConfigured()) {
        console.warn('⚠️ Email credentials not configured in environment. Email sending skipped.');
        return { skipped: true, reason: 'missing-smtp-config' };
    }

    try {
        const transporter = createTransporter();
        const fromAddress = getFromAddress();
        
        console.log(`📧 Sending order confirmation email to ${order.email}...`);
        
        // Create send promise with timeout
        const sendPromise = transporter.sendMail({
            from: `WHT Payments <${fromAddress}>`,
            to: order.email,
            subject: `Order Received - #${order.id}`,
            html: buildOrderEmailHtml(order),
        });
        
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Send email timeout (exceeded 10 seconds)')), 10000)
        );
        
        const info = await Promise.race([sendPromise, timeoutPromise]);
        
        console.log(`✅ Order confirmation email sent successfully to ${order.email}. Message ID: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send order confirmation email to ${order.email}:`, error.code, error.message);
        throw error; // Let the caller handle it
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
  
  if (!isMailerConfigured()) {
    console.warn('⚠️ Email credentials not configured in environment. Email sending skipped.');
    return { skipped: true, reason: 'missing-smtp-config' };
  }

  try {
    const transporter = createTransporter();
    const fromAddress = getFromAddress();
    
    console.log(`📧 Sending status update email to ${order.email} (Order #${order.id}: ${status})...`);
    
    // Create send promise with timeout
    const sendPromise = transporter.sendMail({
      from: `WHT Payments <${fromAddress}>`,
      to: order.email,
      subject: `Order #${order.id} Update - ${status}`,
      html: buildOrderStatusEmailHtml(order, status),
    });
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Send email timeout (exceeded 10 seconds)')), 10000)
    );
    
    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    console.log(`✅ Status update email sent successfully to ${order.email}. Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send status update email to ${order.email}:`, error.code, error.message);
    throw error; // Let the caller handle it
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
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    from: getFromAddress(),
    credentialsSet: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  };
};
