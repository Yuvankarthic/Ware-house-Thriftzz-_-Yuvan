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
import nodemailer from 'nodemailer';

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
        // Validate environment variables
        const missingVars = [];
        if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
        if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
        if (!process.env.SMTP_SECURE) missingVars.push('SMTP_SECURE');
        if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
        if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');
        if (!process.env.MAIL_FROM) missingVars.push('MAIL_FROM');

        if (missingVars.length > 0) {
            console.error('❌ Missing environment variables:', missingVars.join(', '));
            return res.status(400).json({
                status: 'error',
                message: 'SMTP configuration incomplete',
                missingVariables: missingVars,
                received: {
                    SMTP_HOST: process.env.SMTP_HOST ? '✓' : '✗',
                    SMTP_PORT: process.env.SMTP_PORT ? '✓' : '✗',
                    SMTP_SECURE: process.env.SMTP_SECURE ? '✓' : '✗',
                    SMTP_USER: process.env.SMTP_USER ? '✓' : '✗',
                    SMTP_PASS: process.env.SMTP_PASS ? '✓' : '✗',
                    MAIL_FROM: process.env.MAIL_FROM ? '✓' : '✗',
                }
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        console.log(`🧪 Testing email connection to ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}...`);

        // Test the connection
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.SMTP_USER,
            subject: '🧪 Test Email from WHT Backend',
            text: 'If you received this email, the email system is working correctly! 🚀',
            html: `
                <h2>Test Email Success 🚀</h2>
                <p>If you are reading this, the WHT email system is working correctly!</p>
                <p><strong>Details:</strong></p>
                <ul>
                    <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                    <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                    <li>From: ${process.env.MAIL_FROM}</li>
                    <li>Timestamp: ${new Date().toISOString()}</li>
                </ul>
            `
        });

        console.log(`✅ Test email sent successfully! Message ID: ${info.messageId}`);
        
        res.status(200).json({
            status: 'success',
            message: 'Test email sent successfully',
            messageId: info.messageId,
            recipient: process.env.SMTP_USER,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Test email failed:', {
            code: error.code,
            message: error.message,
            response: error.response
        });
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to send test email',
            error: {
                code: error.code || 'UNKNOWN',
                message: error.message,
                details: error.response || null
            },
            help: `
                Common issues:
                - Invalid app password (should not include spaces)
                - Gmail 2FA not enabled
                - App password not generated correctly
                - SMTP credentials configured but network blocked
            `
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
