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
import pool from './db.js';
import { getMailerHealth } from './services/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

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
