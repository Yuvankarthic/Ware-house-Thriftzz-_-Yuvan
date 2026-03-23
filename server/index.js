// ─────────────────────────────────────────────
//  WHT Fashion — Express Server Entry
// ─────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import staffRoutes from './routes/staff.js';
import productRoutes from './routes/products.js';
import operationsRoutes from './routes/operations.js';
import activityRoutes from './routes/activity.js';
import publicRoutes from './routes/public.js';
import pool from './db.js';
import { getMailerHealth } from './services/mailer.js';
import sgMail from '@sendgrid/mail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

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

app.use(express.json());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

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
