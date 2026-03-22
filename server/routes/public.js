import { Router } from 'express';
import pool from '../db.js';

const router = Router();
const query = (text, params) => pool.query(text, params);

const mapTrackingStatus = (orderStatus = '') => {
    const normalized = String(orderStatus).trim().toLowerCase();
    if (normalized === 'delivered') return 'delivered';
    if (['out for delivery', 'packed', 'packing', 'accepted'].includes(normalized)) return 'shipped';
    return 'pending';
};

router.get('/track-order', async (req, res) => {
    try {
        const { order_id, phone } = req.query;

        if (!order_id || !phone) {
            return res.status(400).json({ success: false, error: 'order_id and phone are required' });
        }

        const result = await query(
            `SELECT id, product_name, order_status
             FROM orders
             WHERE id = $1 AND phone = $2
             LIMIT 1`,
            [Number.parseInt(String(order_id), 10), String(phone).trim()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invalid order details' });
        }

        const order = result.rows[0];
        return res.json({
            success: true,
            order_id: order.id,
            product_name: order.product_name,
            order_status: order.order_status,
            status: mapTrackingStatus(order.order_status),
        });
    } catch (err) {
        console.error('❌ GET /track-order error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
