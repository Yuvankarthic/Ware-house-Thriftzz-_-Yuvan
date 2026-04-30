// ─────────────────────────────────────────────
//  WHT Fashion — Express Server Entry
// ─────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import staffRoutes from './routes/staff.js';
import productRoutes from './routes/products.js';
import operationsRoutes from './routes/operations.js';
import activityRoutes from './routes/activity.js';
import settingsRoutes from './routes/settings.js';
import publicRoutes from './routes/public.js';
import chatbotRoutes from './routes/chatbot.js';
import ceoRoutes from './routes/ceo.js';
import cmoRoutes from './routes/cmo.js';
import cfoRoutes from './routes/cfo.js';
import aiRoutes from './routes/ai.js';
import reelsRoutes from './routes/reels.js';
import pool from './db.js';
import { getMailerHealth, sendOrderConfirmationEmail } from './services/mailer.js';
import sgMail from '@sendgrid/mail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const ensureOrderConfirmationEmailForOrder = async (orderId, source = 'webhook') => {
    try {
        const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [orderId]);
        if (orderResult.rows.length === 0) return;

        const order = orderResult.rows[0];
        if (!order?.email) return;

        let alreadySent = false;
        try {
            const emailCheck = await pool.query(
                `SELECT 1
                 FROM order_email_events
                 WHERE order_id = $1
                   AND event_type = 'order_confirmation'
                   AND delivery_status = 'sent'
                 LIMIT 1`,
                [orderId]
            );
            alreadySent = emailCheck.rows.length > 0;
        } catch (checkErr) {
            if (checkErr?.code !== '42P01') {
                console.error('Order confirmation sent-check failed:', checkErr.message);
            }
        }

        if (alreadySent) {
            console.log(`ℹ️ Order #${orderId} confirmation already sent. Skipping webhook fallback send.`);
            return;
        }

        let result = null;
        let reason = null;
        let status = 'failed';

        try {
            result = await sendOrderConfirmationEmail(order);
            if (result?.sent) status = 'sent';
            else if (result?.skipped) {
                status = 'skipped';
                reason = result.reason || 'skipped';
            } else {
                reason = result?.reason || 'unknown-mail-result';
            }
        } catch (mailErr) {
            reason = mailErr?.message || 'send-failed';
        }

        try {
            await pool.query(
                `INSERT INTO order_email_events (order_id, event_type, delivery_status, reason, recipient)
                 VALUES ($1, 'order_confirmation', $2, $3, $4)`,
                [orderId, status, reason, order.email]
            );
        } catch (logErr) {
            if (logErr?.code !== '42P01') {
                console.error('Failed to log webhook fallback order confirmation event:', logErr.message);
            }
        }

        console.log('📧 Webhook fallback confirmation result:', {
            source,
            order_id: orderId,
            recipient: order.email,
            status,
            reason,
        });
    } catch (err) {
        console.error('❌ Webhook fallback order confirmation failed:', err.message);
    }
};

const markOrdersPaidByRazorpayIdentifiers = async ({ paymentId, razorpayOrderId }) => {
    const normalizedPaymentId = paymentId || null;
    const normalizedRazorpayOrderId = razorpayOrderId || null;

    if (!normalizedPaymentId && !normalizedRazorpayOrderId) {
        return { matchedOrders: 0, orderIds: [] };
    }

    const result = await pool.query(
        `UPDATE orders
         SET payment_status = 'paid',
             payment_id = COALESCE(payment_id, $1::text),
             updated_at = NOW()
         WHERE ($1::text IS NOT NULL AND payment_id = $1::text)
            OR ($2::text IS NOT NULL AND payment_id = $2::text)
         RETURNING id`,
        [normalizedPaymentId, normalizedRazorpayOrderId]
    );

    return {
        matchedOrders: result.rows.length,
        orderIds: result.rows.map((row) => row.id),
    };
};

const scheduleWebhookReconciliation = ({ paymentId, razorpayOrderId, event, maxAttempts = 5, attempt = 1 }) => {
    if (attempt > maxAttempts) return;

    const waitMs = 5000 * attempt;
    setTimeout(async () => {
        try {
            const retry = await markOrdersPaidByRazorpayIdentifiers({ paymentId, razorpayOrderId });
            console.log('🔁 Razorpay webhook reconciliation attempt:', {
                event,
                attempt,
                matched_orders: retry.matchedOrders,
                order_ids: retry.orderIds,
            });

            if (retry.matchedOrders > 0) {
                for (const orderId of retry.orderIds) {
                    await ensureOrderConfirmationEmailForOrder(orderId, 'webhook-retry');
                }
            }

            if (retry.matchedOrders === 0) {
                scheduleWebhookReconciliation({
                    paymentId,
                    razorpayOrderId,
                    event,
                    maxAttempts,
                    attempt: attempt + 1,
                });
            }
        } catch (retryErr) {
            console.error('❌ Razorpay webhook reconciliation error:', retryErr.message);
            scheduleWebhookReconciliation({
                paymentId,
                razorpayOrderId,
                event,
                maxAttempts,
                attempt: attempt + 1,
            });
        }
    }, waitMs);
};

// ── CORS Configuration ──
const corsOptions = {
    origin: [
        'https://wearhousethrift.netlify.app',
        'https://wearhousethriftzz.netlify.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Razorpay webhook must use raw JSON body for signature verification.
app.post('/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const receivedAt = new Date().toISOString();
    try {
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body.toString('utf8')
            : JSON.stringify(req.body || {});

        let payload = {};
        try {
            payload = JSON.parse(rawBody);
        } catch (parseErr) {
            console.error('❌ Razorpay webhook: invalid JSON payload', parseErr.message);
            return res.status(200).send('OK');
        }

        console.log('🔔 Razorpay Webhook Received:', {
            receivedAt,
            event: payload?.event,
            account_id: payload?.account_id || null,
        });
        console.log('🧾 Razorpay webhook payload:', payload);

        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (webhookSecret && !signature) {
            console.error('❌ Razorpay webhook missing signature header. Event ignored.');
            return res.status(200).send('OK');
        }

        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');

            if (expectedSignature !== signature) {
                console.error('❌ Razorpay webhook signature mismatch. Event ignored.');
                return res.status(200).send('OK');
            }
        }

        if (!webhookSecret) {
            console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET is not set. Signature verification skipped.');
        }

        const event = String(payload?.event || '');
        const handledEvents = new Set(['payment.captured', 'order.paid']);

        if (!handledEvents.has(event)) {
            console.log(`ℹ️ Razorpay webhook ignored (event: ${event || 'unknown'})`);
            return res.status(200).send('OK');
        }

        const paymentEntity = payload?.payload?.payment?.entity || null;
        const orderEntity = payload?.payload?.order?.entity || null;

        const paymentId = paymentEntity?.id || null;
        const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id || null;
        const amountPaise = Number(paymentEntity?.amount || orderEntity?.amount || 0);
        const amount = Number.isFinite(amountPaise) ? amountPaise / 100 : 0;

        console.log('💳 Razorpay payment event details:', {
            event,
            payment_id: paymentId,
            order_id: razorpayOrderId,
            amount,
        });

        if (!paymentId && !razorpayOrderId) {
            console.warn('⚠️ Razorpay webhook missing payment/order identifiers.');
            return res.status(200).send('OK');
        }

        const updateResult = await markOrdersPaidByRazorpayIdentifiers({ paymentId, razorpayOrderId });

        console.log('✅ Razorpay webhook order update result:', {
            matched_orders: updateResult.matchedOrders,
            order_ids: updateResult.orderIds,
        });

        if (updateResult.matchedOrders > 0) {
            for (const orderId of updateResult.orderIds) {
                await ensureOrderConfirmationEmailForOrder(orderId, 'webhook-initial');
            }
        }

        if (updateResult.matchedOrders === 0) {
            console.warn('⚠️ No order matched yet. Scheduling reconciliation retries...');
            scheduleWebhookReconciliation({ paymentId, razorpayOrderId, event });
        }

        return res.status(200).send('OK');
    } catch (err) {
        console.error('❌ Razorpay webhook processing error:', err.message);
        return res.status(200).send('OK');
    }
});

app.use(express.json());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Temporary test route
app.get('/test', (req, res) => res.send("Server working"));

// ── Root route ──
app.get('/', (_req, res) => {
    res.json({ message: 'Backend working', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api', activityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', ceoRoutes);
app.use('/api/ai', cmoRoutes);
app.use('/api/ai', cfoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai', reelsRoutes);
app.use('/api', publicRoutes);

// Root aliases for direct calls without /api prefix.
app.use('/', activityRoutes);
app.use('/', publicRoutes);

app.get('/debug/routes', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        routes: {
            orders: true,
            auth: true,
            analytics: true,
            staff: false
        }
    });
});

// ── Health check ──
app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        const mailer = getMailerHealth();
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            mailer,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        const mailer = getMailerHealth();
        res.status(503).json({
            status: 'degraded',
            database: 'down',
            mailer: { ...mailer, status: 'down' },
            timestamp: new Date().toISOString()
        });
    }
});

// ── Test Email Endpoint ──
app.get('/test-email', async (_req, res) => {
    try {
        const service = String(process.env.EMAIL_SERVICE || 'sendgrid').toLowerCase();
        const isSendGrid = service === 'sendgrid' && process.env.SENDGRID_API_KEY;
        const isBrevo = service === 'brevo' && process.env.BREVO_API_KEY;
        const hasBrevo = Boolean(process.env.BREVO_API_KEY);
        
        console.log(`🧪 Testing email service: ${isSendGrid ? 'SendGrid' : isBrevo ? 'Brevo' : service}...`);
        
        // Validate required variables
        if (!process.env.MAIL_FROM) {
            return res.status(400).json({
                status: 'error',
                message: 'MAIL_FROM environment variable is missing',
            });
        }
        
        const recipient = process.env.MAIL_FROM;
        const subject = '🧪 Test Email from WHT Backend';
        const text = 'If you received this email, the email system is working correctly! 🚀';
        const html = `
            <h2>Test Email Success 🚀</h2>
            <p>If you are reading this, the WHT email system is working correctly!</p>
            <p><strong>Service:</strong> ${isSendGrid ? 'SendGrid' : isBrevo ? 'Brevo' : service}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `;
        
        if (isSendGrid) {
            // Send via SendGrid
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: recipient,
                from: process.env.MAIL_FROM,
                subject,
                text,
                html,
            };
            const response = await sgMail.send(msg);
            const messageId = response[0]?.messageId || 'sent';
            
            console.log(`✅ Test email sent via SendGrid! Message ID: ${messageId}`);
            return res.status(200).json({
                status: 'success',
                message: 'Test email sent successfully via SendGrid',
                service: 'SendGrid',
                recipient,
                timestamp: new Date().toISOString()
            });
        }

        if (isBrevo || (!isSendGrid && hasBrevo)) {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                },
                body: JSON.stringify({
                    sender: { email: process.env.MAIL_FROM, name: 'WHT Payments' },
                    to: [{ email: recipient }],
                    subject,
                    htmlContent: html,
                    textContent: text,
                }),
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Brevo API error (${response.status}): ${body}`);
            }

            return res.status(200).json({
                status: 'success',
                message: 'Test email sent successfully via Brevo',
                service: 'Brevo',
                recipient,
                timestamp: new Date().toISOString()
            });
        }
        
        // No supported API email provider configured
        return res.status(400).json({
            status: 'error',
            message: 'Email service not configured',
            missingConfig: {
                EMAIL_SERVICE: !process.env.EMAIL_SERVICE,
                SENDGRID_API_KEY: !process.env.SENDGRID_API_KEY,
                BREVO_API_KEY: !process.env.BREVO_API_KEY,
                MAIL_FROM: !process.env.MAIL_FROM,
            },
            hint: 'Set EMAIL_SERVICE to sendgrid or brevo and provide matching API key'
        });
        
    } catch (error) {
        console.error('❌ Test email failed:', {
            code: error.code,
            message: error.message,
        });
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to send test email',
            error: {
                code: error.code || 'UNKNOWN',
                message: error.message,
            },
            help: 'Check your email service credentials in environment variables'
        });
    }
});

// ── 404 handler ──
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('🔥 ERROR:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// ── Start Server ──
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// ── Graceful shutdown ──
process.on('SIGTERM', () => {
    console.log('📋 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// ── Handle unhandled errors ──
process.on('uncaughtException', (err) => {
    console.error('💥 Unhandled Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
