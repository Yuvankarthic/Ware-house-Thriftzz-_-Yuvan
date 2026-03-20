// ─────────────────────────────────────────────
//  Analytics Routes  —  /api/analytics/*
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
const query = (text, params) => pool.query(text, params);
import { authMiddleware } from '../auth.js';

const router = Router();

// ── GET /api/analytics/overview  —  Dashboard KPIs ──
router.get('/overview', authMiddleware, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [totalToday, pending, packing, outForDelivery, delivered, revenue] = await Promise.all([
            query(`SELECT COUNT(*)::int AS count FROM orders WHERE DATE(created_at) = $1`, [today]),
            query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_status IN ('New Order', 'Accepted') AND DATE(created_at) = $1`, [today]),
            query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_status = 'Packing' AND DATE(created_at) = $1`, [today]),
            query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_status = 'Out for Delivery' AND DATE(created_at) = $1`, [today]),
            query(`SELECT COUNT(*)::int AS count FROM orders WHERE order_status = 'Delivered' AND DATE(created_at) = $1`, [today]),
            query(`SELECT COALESCE(SUM(order_value), 0)::numeric AS total FROM orders WHERE DATE(created_at) = $1`, [today]),
        ]);

        return res.json({
            success: true,
            metrics: {
                total_orders_today: totalToday.rows[0].count,
                pending_orders: pending.rows[0].count,
                packing_orders: packing.rows[0].count,
                out_for_delivery: outForDelivery.rows[0].count,
                delivered_today: delivered.rows[0].count,
                revenue_today: parseFloat(revenue.rows[0].total),
            },
        });
    } catch (err) {
        console.error('❌ analytics/overview error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ── GET /api/analytics/hourly  —  Orders per hour ──
router.get('/hourly', authMiddleware, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await query(
            `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
             FROM orders WHERE DATE(created_at) = $1
             GROUP BY hour ORDER BY hour`,
            [today]
        );

        // Fill all 24 hours
        const hourly = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
            count: 0,
        }));
        for (const row of result.rows) {
            hourly[row.hour].count = row.count;
        }

        return res.json({ success: true, hourly });
    } catch (err) {
        console.error('❌ analytics/hourly error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ── GET /api/analytics/top-products ──
router.get('/top-products', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT product_name, COUNT(*)::int AS orders, SUM(order_value)::numeric AS revenue
             FROM orders WHERE product_name IS NOT NULL
             GROUP BY product_name ORDER BY orders DESC LIMIT 10`
        );
        return res.json({ success: true, products: result.rows });
    } catch (err) {
        console.error('❌ analytics/top-products error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ── GET /api/analytics/by-location ──
router.get('/by-location', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT city, COUNT(*)::int AS orders
             FROM orders WHERE city IS NOT NULL
             GROUP BY city ORDER BY orders DESC LIMIT 10`
        );
        return res.json({ success: true, locations: result.rows });
    } catch (err) {
        console.error('❌ analytics/by-location error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

