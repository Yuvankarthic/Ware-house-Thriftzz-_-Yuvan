// ─────────────────────────────────────────────
//  Order Routes  —  /api/orders/*
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
const query = (text, params) => pool.query(text, params);
import { authMiddleware } from '../auth.js';

const router = Router();

// Valid status workflow
const STATUS_FLOW = ['New Order', 'Accepted', 'Packing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

// ────────────────────────────────────────────────────────────
//  POST /api/orders  (public — called from storefront checkout)
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { customer_name, email, phone, address, city, pincode, product_id, quantity, payment_id } = req.body;

        const missing = [];
        if (!customer_name?.trim()) missing.push('customer_name');
        if (!phone?.trim())          missing.push('phone');
        if (!address?.trim())        missing.push('address');
        if (!city?.trim())           missing.push('city');
        if (!pincode?.trim())        missing.push('pincode');
        if (!product_id)             missing.push('product_id');

        if (missing.length > 0) {
            return res.status(400).json({ success: false, error: `Missing: ${missing.join(', ')}` });
        }

        // Check product
        const prodResult = await query('SELECT * FROM products WHERE id = $1', [product_id]);
        if (prodResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        const product = prodResult.rows[0];

        if (product.stock <= 0) {
            return res.status(400).json({ success: false, error: 'This item is sold out — one-of-one piece.' });
        }

        // Mark sold
        await query('UPDATE products SET stock = 0 WHERE id = $1', [product_id]);

        const orderValue = product.price * (quantity || 1);
        const fullAddress = `${address}, ${city} - ${pincode}`;

        const orderResult = await query(
            `INSERT INTO orders
                (customer_name, email, phone, full_address, city, pincode,
                 product_name, product_id, quantity, order_value,
                 payment_method, payment_status, payment_id, order_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'New Order')
             RETURNING *`,
            [customer_name, email || null, phone, fullAddress, city, pincode,
             product.name, product_id, quantity || 1, orderValue,
             'Prepaid', 'paid', payment_id || null]
        );

        const order = orderResult.rows[0];

        // Add timeline entry
        await query(
            `INSERT INTO order_timeline (order_id, status, note) VALUES ($1, 'New Order', 'Order placed by customer')`,
            [order.id]
        );

        console.log(`📦 New order #${order.id} — ${product.name} — ₹${orderValue}`);

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: { order_id: order.id, product: product.name, order_value: orderValue, status: 'New Order' },
        });
    } catch (err) {
        console.error('❌ POST /api/orders error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  GET /api/orders  (admin — list with search/filter/sort)
// ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, search, delivery_partner, assigned_to, city, date, sort, page, limit } = req.query;

        let sql = `
            SELECT o.*, s.name AS assigned_name
            FROM orders o
            LEFT JOIN staff s ON o.assigned_to = s.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        if (status && status !== 'all') {
            sql += ` AND o.order_status = $${idx++}`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (
                o.customer_name ILIKE $${idx} OR
                o.phone ILIKE $${idx} OR
                CAST(o.id AS TEXT) ILIKE $${idx}
            )`;
            params.push(`%${search}%`);
            idx++;
        }

        if (delivery_partner) {
            sql += ` AND o.delivery_partner = $${idx++}`;
            params.push(delivery_partner);
        }

        if (assigned_to) {
            sql += ` AND o.assigned_to = $${idx++}`;
            params.push(parseInt(assigned_to));
        }

        if (city) {
            sql += ` AND o.city ILIKE $${idx++}`;
            params.push(`%${city}%`);
        }

        if (date) {
            sql += ` AND DATE(o.created_at) = $${idx++}`;
            params.push(date);
        }

        // Sort
        const sortMap = {
            newest: 'o.created_at DESC',
            oldest: 'o.created_at ASC',
            value_high: 'o.order_value DESC',
            value_low: 'o.order_value ASC',
        };
        sql += ` ORDER BY ${sortMap[sort] || 'o.created_at DESC'}`;

        // Pagination
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 50;
        sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(pageSize, (pageNum - 1) * pageSize);

        const result = await query(sql, params);

        // Get total count for pagination
        let countSql = 'SELECT COUNT(*)::int AS total FROM orders WHERE 1=1';
        // (simplified — doesn't repeat filters for count, fine for MVP)

        return res.json({ success: true, orders: result.rows, page: pageNum, limit: pageSize });
    } catch (err) {
        console.error('❌ GET /api/orders error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  GET /api/orders/:id  (admin — order detail)
// ────────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT o.*, s.name AS assigned_name
             FROM orders o
             LEFT JOIN staff s ON o.assigned_to = s.id
             WHERE o.id = $1`,
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Get timeline
        const timeline = await query(
            `SELECT t.*, s.name AS changed_by_name
             FROM order_timeline t
             LEFT JOIN staff s ON t.changed_by = s.id
             WHERE t.order_id = $1
             ORDER BY t.created_at ASC`,
            [req.params.id]
        );

        return res.json({
            success: true,
            order: result.rows[0],
            timeline: timeline.rows,
        });
    } catch (err) {
        console.error('❌ GET /api/orders/:id error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  PATCH /api/orders/:id/status  (admin — update status)
// ────────────────────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!STATUS_FLOW.includes(status)) {
            return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${STATUS_FLOW.join(', ')}` });
        }

        const orderResult = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // If claiming (Accepted), auto-assign
        let assignUpdate = '';
        const params = [status, new Date(), req.params.id];
        if (status === 'Accepted' && !order.assigned_to) {
            assignUpdate = ', assigned_to = $4';
            params.push(req.user.id);
        }

        await query(
            `UPDATE orders SET order_status = $1, updated_at = $2 ${assignUpdate} WHERE id = $3`,
            params
        );

        // Timeline entry
        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, $2, $3, $4)`,
            [req.params.id, status, req.user.id, `Status changed to "${status}" by ${req.user.name}`]
        );

        console.log(`📋 Order #${req.params.id} → ${status} (by ${req.user.name})`);

        return res.json({ success: true, message: `Order updated to "${status}"` });
    } catch (err) {
        console.error('❌ PATCH /api/orders/:id/status error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  PATCH /api/orders/:id/assign  (admin — claim order)
// ────────────────────────────────────────────────────────────
router.patch('/:id/assign', authMiddleware, async (req, res) => {
    try {
        const orderResult = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const order = orderResult.rows[0];
        if (order.assigned_to && order.assigned_to !== req.user.id) {
            const staff = await query('SELECT name FROM staff WHERE id = $1', [order.assigned_to]);
            const assignedName = staff.rows[0]?.name || 'another staff member';
            return res.status(409).json({
                success: false,
                error: `Order already claimed by ${assignedName}`,
            });
        }

        await query(
            `UPDATE orders SET assigned_to = $1, updated_at = NOW() WHERE id = $2`,
            [req.user.id, req.params.id]
        );

        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, $2, $3, $4)`,
            [req.params.id, order.order_status, req.user.id, `Claimed by ${req.user.name}`]
        );

        return res.json({ success: true, message: 'Order claimed successfully' });
    } catch (err) {
        console.error('❌ PATCH /api/orders/:id/assign error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  PATCH /api/orders/:id/delivery  (admin — set delivery info)
// ────────────────────────────────────────────────────────────
router.patch('/:id/delivery', authMiddleware, async (req, res) => {
    try {
        const { delivery_partner, delivery_notes, rider_phone, tracking_ref } = req.body;

        await query(
            `UPDATE orders
             SET delivery_partner = $1, delivery_notes = $2,
                 rider_phone = $3, tracking_ref = $4, updated_at = NOW()
             WHERE id = $5`,
            [delivery_partner || null, delivery_notes || null,
             rider_phone || null, tracking_ref || null, req.params.id]
        );

        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, (SELECT order_status FROM orders WHERE id = $1), $2, $3)`,
            [req.params.id, req.user.id, `Delivery partner set: ${delivery_partner || 'none'}`]
        );

        return res.json({ success: true, message: 'Delivery info updated' });
    } catch (err) {
        console.error('❌ PATCH /api/orders/:id/delivery error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

