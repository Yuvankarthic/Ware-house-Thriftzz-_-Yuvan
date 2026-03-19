// ─────────────────────────────────────────────
//  WHT Fashion — Express Server Entry
// ─────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import orderRoutes from './routes/orders.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import staffRoutes from './routes/staff.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── CORS Configuration (Production-Ready) ──
// Define allowed frontend domains
const allowedOrigins = [
    'https://wearhousethrift.netlify.app',
    'https://warehousethrriftzz.netlify.app',
    'http://localhost:3000',        // Local development
    'http://localhost:5173'         // Vite dev server
];

// CORS middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // In production, you might want to log unauthorized origins
            console.warn(`⚠️ CORS blocked request from: ${origin}`);
            callback(new Error('CORS policy: request origin not allowed'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

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
app.use('/api/staff', staffRoutes);

// ── Health check with explicit CORS ──
app.options('/health', cors());
app.head('/health', (_req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept');
    res.sendStatus(200);
});
app.get('/health', (_req, res) => {
    // Send minimal response as quickly as possible
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept');
    res.status(200).json({ 
        status: 'ok',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime()
    });
});

// ── 404 handler ──
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong' });
});

// ── Start Server ──
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 WHT Fashion Backend Server`);
    console.log(`📌 Environment: ${NODE_ENV}`);
    console.log(`🔌 Listening on: 0.0.0.0:${PORT}`);
    console.log(`🌐 Public URL: https://ware-house-thriftzz-yuvan-production.up.railway.app`);
    console.log(`✅ CORS enabled: *`);
    console.log(`📡 Health check: /health`);
    console.log(`\n✨ Server is ready to accept connections\n`);
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
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
