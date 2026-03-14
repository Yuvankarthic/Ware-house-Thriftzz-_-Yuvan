// ─────────────────────────────────────────────
//  Order Routes  —  /create-order, /create-delivery, /track-order/:id
// ─────────────────────────────────────────────
import { Router } from 'express';
import { query } from '../db.js';
import { createShipment, getToken } from '../shiprocket.js';

const router = Router();

// ────────────────────────────────────────────────────────────
//  POST /create-order
//  1. Validate input
//  2. Check product stock (thrift: must be 1)
//  3. Set stock → 0  (one-of-one item sold)
//  4. Insert order in DB
//  5. Try Shiprocket shipment
//  6. Update order with shipment details (or leave as pending_shipment)
// ────────────────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
    try {
        const { customer_name, email, phone, address, city, pincode, product_id, quantity } = req.body;

        // ── Input validation ──
        const missing = [];
        if (!customer_name?.trim()) missing.push('customer_name');
        if (!phone?.trim())          missing.push('phone');
        if (!address?.trim())        missing.push('address');
        if (!city?.trim())           missing.push('city');
        if (!pincode?.trim())        missing.push('pincode');
        if (!product_id)             missing.push('product_id');

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missing.join(', ')}`,
            });
        }

        // ── Check product exists & is in stock ──
        const productResult = await query('SELECT * FROM products WHERE id = $1', [product_id]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const product = productResult.rows[0];

        if (product.stock <= 0) {
            return res.status(400).json({
                success: false,
                error: 'This item is sold out — it was a one-of-one piece.',
            });
        }

        // ── Mark item as sold (stock → 0, thrift one-of-one) ──
        await query('UPDATE products SET stock = 0 WHERE id = $1', [product_id]);

        const orderPrice = product.price * (quantity || 1);

        // ── Insert order ──
        const orderResult = await query(
            `INSERT INTO orders
                (customer_name, email, phone, address, city, pincode,
                 product_id, quantity, price, order_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'processing')
             RETURNING *`,
            [customer_name, email || null, phone, address, city, pincode,
             product_id, quantity || 1, orderPrice]
        );

        const order = orderResult.rows[0];
        console.log(`📦 Order #${order.id} created for "${product.name}"`);

        // ── Try Shiprocket shipment (non-blocking on failure) ──
        let shipmentData = null;
        try {
            shipmentData = await createShipment({
                order_id: `WHT-${order.id}`,
                customer_name,
                email: email || '',
                phone,
                address,
                city,
                pincode,
                items: [{
                    name: product.name,
                    product_id: product.id,
                    quantity: quantity || 1,
                    price: product.price,
                }],
                sub_total: orderPrice,
            });

            // Update order with shipment details
            await query(
                `UPDATE orders
                 SET shipment_id   = $1,
                     tracking_url  = $2,
                     order_status  = 'shipped'
                 WHERE id = $3`,
                [
                    String(shipmentData.shipment_id || shipmentData.order_id || ''),
                    shipmentData.tracking_url || shipmentData.status_url || null,
                    order.id,
                ]
            );

            order.shipment_id  = shipmentData.shipment_id || shipmentData.order_id;
            order.tracking_url = shipmentData.tracking_url || shipmentData.status_url;
            order.order_status = 'shipped';

            console.log(`🚚 Shipment created for order #${order.id}`);
        } catch (shipError) {
            // Shiprocket failed → keep order, mark as pending_shipment
            console.error(`⚠️  Shiprocket shipment failed for order #${order.id}:`, shipError.message);

            await query(
                `UPDATE orders SET order_status = 'pending_shipment' WHERE id = $1`,
                [order.id]
            );

            order.order_status = 'pending_shipment';
            order.shipment_id  = null;
            order.tracking_url = null;
        }

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: {
                order_id: order.id,
                customer_name: order.customer_name,
                product: product.name,
                price: order.price,
                order_status: order.order_status,
                shipment_id: order.shipment_id,
                tracking_url: order.tracking_url,
                created_at: order.created_at,
            },
        });
    } catch (err) {
        console.error('❌ /create-order error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});


// ────────────────────────────────────────────────────────────
//  POST /create-delivery
//  Standalone endpoint to create a Shiprocket shipment
//  (useful for retrying failed shipments or manual creation)
// ────────────────────────────────────────────────────────────
router.post('/create-delivery', async (req, res) => {
    try {
        const {
            order_id,
            billing_customer_name,
            billing_address,
            billing_city,
            billing_pincode,
            billing_state,
            billing_phone,
            billing_email,
            order_items,
            payment_method,
            sub_total,
        } = req.body;

        if (!order_id || !billing_customer_name || !billing_phone) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: order_id, billing_customer_name, billing_phone',
            });
        }

        // Authenticate
        const token = await getToken();

        // Build Shiprocket payload
        const shipmentData = await createShipment({
            order_id: String(order_id),
            customer_name: billing_customer_name,
            email: billing_email || '',
            phone: billing_phone,
            address: billing_address,
            city: billing_city,
            pincode: billing_pincode,
            state: billing_state || 'Karnataka',
            items: (order_items || []).map(item => ({
                name: item.name,
                product_id: item.sku || item.name,
                quantity: item.units || 1,
                price: item.selling_price,
            })),
            sub_total: sub_total || 0,
            payment_method: payment_method || 'Prepaid',
        });

        // If this is tied to a DB order, update it
        const dbOrderId = String(order_id).replace('WHT-', '');
        const numericId = parseInt(dbOrderId, 10);
        if (!isNaN(numericId)) {
            await query(
                `UPDATE orders
                 SET shipment_id  = $1,
                     tracking_url = $2,
                     order_status = 'shipped'
                 WHERE id = $3`,
                [
                    String(shipmentData.shipment_id || shipmentData.order_id || ''),
                    shipmentData.tracking_url || shipmentData.status_url || null,
                    numericId,
                ]
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Shiprocket shipment created',
            shipment: shipmentData,
        });
    } catch (err) {
        console.error('❌ /create-delivery error:', err);
        return res.status(500).json({ success: false, error: 'Failed to create delivery' });
    }
});


// ────────────────────────────────────────────────────────────
//  GET /track-order/:id
// ────────────────────────────────────────────────────────────
router.get('/track-order/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT o.*, p.name AS product_name
             FROM orders o
             LEFT JOIN products p ON o.product_id = p.id
             WHERE o.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const order = result.rows[0];

        return res.json({
            success: true,
            order: {
                order_id: order.id,
                customer_name: order.customer_name,
                product: order.product_name,
                quantity: order.quantity,
                price: order.price,
                status: order.order_status,
                shipment_id: order.shipment_id,
                tracking_url: order.tracking_url,
                created_at: order.created_at,
            },
        });
    } catch (err) {
        console.error('❌ /track-order error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
