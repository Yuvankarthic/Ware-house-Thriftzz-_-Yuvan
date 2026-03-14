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

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── Routes ──
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/staff', staffRoutes);

// ── Health check ──
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong' });
});

// ── Start ──
app.listen(PORT, () => {
    console.log(`\n🚀 WHT Fashion server running on http://localhost:${PORT}`);
    console.log(`   POST /api/orders          — create order`);
    console.log(`   GET  /api/orders          — list orders (admin)`);
    console.log(`   POST /api/auth/login      — admin login`);
    console.log(`   GET  /api/analytics/*     — dashboard analytics`);
    console.log(`   GET  /api/staff           — staff management`);
    console.log(`   GET  /health\n`);
});
