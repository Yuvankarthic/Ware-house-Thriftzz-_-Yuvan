// ─────────────────────────────────────────────
//  Order Routes  —  /api/orders/*
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
const query = (text, params) => pool.query(text, params);
import { authMiddleware } from '../auth.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/mailer.js';

const router = Router();

// Valid status workflow
const STATUS_FLOW = ['New Order', 'Accepted', 'Packing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
const EMAIL_EVENT_ORDER = ['order_confirmation', 'packed', 'out_for_delivery', 'delivered'];
const EMAIL_EVENT_LABELS = {
    order_confirmation: 'Order Confirmation',
    packed: 'Packed',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
};
const STATUS_TO_EMAIL_EVENT = {
    Packed: 'packed',
    'Out for Delivery': 'out_for_delivery',
    Delivered: 'delivered',
};

const PICKER_NAMES = ['akash', 'vishwa', 'yuvan'];

const ensureOrderIdSequence = async () => {
    // Keep order IDs in the requested 181001+ range while preserving higher existing IDs.
    await query(
        `SELECT setval(
            pg_get_serial_sequence('orders', 'id'),
            GREATEST(COALESCE((SELECT MAX(id) FROM orders), 0), 180000),
            true
        )`
    );
};

const mapTrackingStatus = (orderStatus = '') => {
    const normalized = String(orderStatus).trim().toLowerCase();
    if (normalized === 'delivered') return 'delivered';
    if (['out for delivery', 'packed', 'packing', 'accepted'].includes(normalized)) return 'shipped';
    return 'pending';
};

const resolveChangedById = async (userId) => {
    if (!userId) return null;
    const result = await query('SELECT id FROM staff WHERE id = $1 LIMIT 1', [userId]);
    return result.rows.length > 0 ? result.rows[0].id : null;
};

const normalizeMailResult = (result, err) => {
    if (err) {
        return {
            status: 'failed',
            reason: err.message || 'send-failed',
            raw: { sent: false, error: err.message || 'send-failed' },
        };
    }
    if (result?.sent) {
        return { status: 'sent', reason: null, raw: result };
    }
    if (result?.skipped) {
        return { status: 'skipped', reason: result.reason || 'skipped', raw: result };
    }
    return {
        status: 'failed',
        reason: result?.reason || 'unknown-mail-result',
        raw: result || { sent: false, reason: 'unknown-mail-result' },
    };
};

const logOrderEmailEvent = async ({ orderId, eventType, recipient, result, error }) => {
    const normalized = normalizeMailResult(result, error);
    try {
        await query(
            `INSERT INTO order_email_events (order_id, event_type, delivery_status, reason, recipient)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, eventType, normalized.status, normalized.reason, recipient || null]
        );
    } catch (dbErr) {
        // Never block checkout or status updates if migration is not yet applied.
        if (dbErr?.code === '42P01') {
            console.warn('order_email_events table missing. Run migration to enable email delivery dashboard.');
        } else {
            console.error('Failed to store order email event:', dbErr.message);
        }
    }
    return normalized;
};

const getOrderEmailSummary = async (orderId) => {
    let rows = { rows: [] };
    try {
        rows = await query(
            `SELECT DISTINCT ON (event_type)
                event_type, delivery_status, reason, recipient, created_at
             FROM order_email_events
             WHERE order_id = $1
             ORDER BY event_type, created_at DESC`,
            [orderId]
        );
    } catch (dbErr) {
        if (dbErr?.code !== '42P01') {
            throw dbErr;
        }
    }

    const byEvent = rows.rows.reduce((acc, row) => {
        acc[row.event_type] = row;
        return acc;
    }, {});

    return EMAIL_EVENT_ORDER.map((eventType) => {
        const row = byEvent[eventType];
        return {
            event_type: eventType,
            label: EMAIL_EVENT_LABELS[eventType],
            status: row?.delivery_status || 'pending',
            reason: row?.reason || null,
            recipient: row?.recipient || null,
            last_attempt_at: row?.created_at || null,
        };
    });
};

// ────────────────────────────────────────────────────────────
//  POST /api/orders  (public — called from storefront checkout)
// ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        await ensureOrderIdSequence();

        const {
            customer_name,
            email,
            phone,
            address,
            city,
            pincode,
            product_id,
            product_name,
            order_value,
            quantity,
            payment_id
        } = req.body;

        const missing = [];
        if (!customer_name?.trim()) missing.push('customer_name');
        if (!phone?.trim())          missing.push('phone');
        if (!address?.trim())        missing.push('address');
        if (!city?.trim())           missing.push('city');
        if (!pincode?.trim())        missing.push('pincode');
        if (!product_id && !product_name) missing.push('product_id or product_name');

        if (missing.length > 0) {
            return res.status(400).json({ success: false, error: `Missing: ${missing.join(', ')}` });
        }

        const parsedProductId = Number.parseInt(String(product_id ?? ''), 10);
        let product = null;

        if (Number.isInteger(parsedProductId)) {
            const prodResult = await query('SELECT * FROM products WHERE id = $1', [parsedProductId]);
            if (prodResult.rows.length > 0) {
                product = prodResult.rows[0];
                if (product.stock <= 0) {
                    return res.status(400).json({ success: false, error: 'This item is sold out — one-of-one piece.' });
                }
                // Mark sold only when a real DB product is matched.
                await query('UPDATE products SET stock = 0 WHERE id = $1', [parsedProductId]);
            }
        }

        if (!product && !product_name) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const safeQuantity = Number.parseInt(String(quantity || 1), 10) || 1;
        const orderValue = product
            ? Number(product.price) * safeQuantity
            : Number(order_value || 0);

        if (!orderValue || Number.isNaN(orderValue) || orderValue <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid order value' });
        }

        const orderProductName = product?.name || String(product_name).trim();
        const fullAddress = `${address}, ${city} - ${pincode}`;

        const orderResult = await query(
            `INSERT INTO orders
                (customer_name, email, phone, full_address, city, pincode,
                 product_name, product_id, quantity, order_value,
                 payment_method, payment_status, payment_id, order_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'New Order')
             RETURNING *`,
            [customer_name, email || null, phone, fullAddress, city, pincode,
             orderProductName, product?.id || null, safeQuantity, orderValue,
             'Prepaid', 'paid', payment_id || null]
        );

        const order = orderResult.rows[0];

        // Add timeline entry
        await query(
            `INSERT INTO order_timeline (order_id, status, note) VALUES ($1, 'New Order', 'Order placed by customer')`,
            [order.id]
        );

        let confirmationResult = null;
        let confirmationError = null;
        try {
            confirmationResult = await sendOrderConfirmationEmail(order);
            console.log(`📧 Order confirmation email result for ${order.email || 'no-email'}:`, confirmationResult);
        } catch (mailError) {
            // Email failures should never block order placement.
            confirmationError = mailError;
            console.error('Order confirmation email failed:', mailError.message);
        }
        const confirmationMail = await logOrderEmailEvent({
            orderId: order.id,
            eventType: 'order_confirmation',
            recipient: order.email,
            result: confirmationResult,
            error: confirmationError,
        });

        console.log(`📦 New order #${order.id} — ${orderProductName} — ₹${orderValue}`);

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: { order_id: order.id, product: orderProductName, order_value: orderValue, status: 'New Order' },
            email: confirmationMail,
        });
    } catch (err) {
        console.error('❌ POST /api/orders error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  GET /api/orders/track-order?order_id=181001&phone=9876543210
//  Public, auth-less order lookup for customer tracking
// ────────────────────────────────────────────────────────────
router.get('/track-order', async (req, res) => {
    try {
        const { order_id, phone } = req.query;

        if (!order_id || !phone) {
            return res.status(400).json({ success: false, error: 'order_id and phone are required' });
        }

        const orderResult = await query(
            `SELECT id, product_name, order_status
             FROM orders
             WHERE id = $1 AND phone = $2
             LIMIT 1`,
            [Number.parseInt(String(order_id), 10), String(phone).trim()]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invalid order details' });
        }

        const order = orderResult.rows[0];
        return res.json({
            success: true,
            order_id: order.id,
            product_name: order.product_name,
            order_status: order.order_status,
            status: mapTrackingStatus(order.order_status),
        });
    } catch (err) {
        console.error('❌ GET /api/orders/track-order error:', err);
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
//  GET /api/orders/track/:id  (public — customer tracking)
// ────────────────────────────────────────────────────────────
router.get('/track/:id', async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'phone is required' });
        }

        const orderResult = await query(
            `SELECT id, customer_name, phone, product_name, quantity, order_value, order_status, created_at, updated_at
             FROM orders
             WHERE id = $1 AND phone = $2`,
            [req.params.id, String(phone)]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invalid order details' });
        }

        const timelineResult = await query(
            `SELECT status, note, created_at
             FROM order_timeline
             WHERE order_id = $1
             ORDER BY created_at ASC`,
            [req.params.id]
        );

        return res.json({ success: true, order: orderResult.rows[0], timeline: timelineResult.rows });
    } catch (err) {
        console.error('❌ GET /api/orders/track/:id error:', err);
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
//  GET /api/orders/:id/email-status  (admin — last mail status per event)
// ────────────────────────────────────────────────────────────
router.get('/:id/email-status', authMiddleware, async (req, res) => {
    try {
        const orderCheck = await query('SELECT id FROM orders WHERE id = $1 LIMIT 1', [req.params.id]);
        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const summary = await getOrderEmailSummary(req.params.id);
        return res.json({ success: true, order_id: Number(req.params.id), summary });
    } catch (err) {
        console.error('❌ GET /api/orders/:id/email-status error:', err);
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

        const changedById = await resolveChangedById(req.user.id);

        // Timeline entry
        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, $2, $3, $4)`,
            [req.params.id, status, changedById, `Status changed to "${status}" by ${req.user.name}`]
        );

        let statusMail = null;
        if (['Packed', 'Out for Delivery', 'Delivered'].includes(status)) {
            const eventType = STATUS_TO_EMAIL_EVENT[status];
            let statusMailResult = null;
            let statusMailError = null;
            try {
                const latestOrder = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
                if (latestOrder.rows.length > 0) {
                    statusMailResult = await sendOrderStatusUpdateEmail(latestOrder.rows[0], status);
                    console.log(`📧 Status email result for order #${req.params.id} (${status}):`, statusMailResult);
                    statusMail = await logOrderEmailEvent({
                        orderId: req.params.id,
                        eventType,
                        recipient: latestOrder.rows[0].email,
                        result: statusMailResult,
                        error: null,
                    });
                }
            } catch (mailError) {
                statusMailError = mailError;
                console.error(`Status email failed for order #${req.params.id}:`, mailError.message);
            }

            if (!statusMail && eventType) {
                statusMail = await logOrderEmailEvent({
                    orderId: req.params.id,
                    eventType,
                    recipient: order.email,
                    result: statusMailResult,
                    error: statusMailError,
                });
            }
        }

        console.log(`📋 Order #${req.params.id} → ${status} (by ${req.user.name})`);

        return res.json({ success: true, message: `Order updated to "${status}"`, email: statusMail });
    } catch (err) {
        console.error('❌ PATCH /api/orders/:id/status error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ────────────────────────────────────────────────────────────
//  PATCH /api/orders/:id/assign-picker (admin — assign picker)
// ────────────────────────────────────────────────────────────
router.patch('/:id/assign-picker', authMiddleware, async (req, res) => {
    try {
        const { picker_name } = req.body;
        const normalized = String(picker_name || '').trim().toLowerCase();

        if (!PICKER_NAMES.includes(normalized)) {
            return res.status(400).json({ success: false, error: 'picker_name must be Akash, Vishwa, or Yuvan' });
        }

        const staffResult = await query(
            `SELECT id, name FROM staff WHERE LOWER(name) = $1 LIMIT 1`,
            [normalized]
        );

        if (staffResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: `Staff ${picker_name} not found in staff table` });
        }

        const staff = staffResult.rows[0];

        const updateResult = await query(
            `UPDATE orders
             SET assigned_to = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [staff.id, req.params.id]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const changedById = await resolveChangedById(req.user.id);

        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, (SELECT order_status FROM orders WHERE id = $1), $2, $3)`,
            [req.params.id, changedById, `Order picked by ${staff.name}`]
        );

        return res.json({ success: true, message: `Assigned to ${staff.name}`, order: updateResult.rows[0] });
    } catch (err) {
        console.error('❌ PATCH /api/orders/:id/assign-picker error:', err);
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

        const changedById = await resolveChangedById(req.user.id);

        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, $2, $3, $4)`,
            [req.params.id, order.order_status, changedById, `Claimed by ${req.user.name}`]
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

        const changedById = await resolveChangedById(req.user.id);

        await query(
            `INSERT INTO order_timeline (order_id, status, changed_by, note)
             VALUES ($1, (SELECT order_status FROM orders WHERE id = $1), $2, $3)`,
            [req.params.id, changedById, `Delivery partner set: ${delivery_partner || 'none'}`]
        );

        return res.json({ success: true, message: 'Delivery info updated' });
    } catch (err) {
        console.error('❌ PATCH /api/orders/:id/delivery error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

