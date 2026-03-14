// ─────────────────────────────────────────────
//  Shiprocket API Service
// ─────────────────────────────────────────────
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = null;
let tokenExpiry = null;

/**
 * Authenticate with Shiprocket and cache the token (valid ~10 days).
 * @returns {Promise<string>} Bearer token
 */
export async function getToken() {
    // Reuse cached token if still valid (refresh 1 hour before expiry)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        const response = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        });

        cachedToken = response.data.token;
        // Shiprocket tokens last ~10 days; refresh after 9 days
        tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;

        console.log('✅ Shiprocket authenticated successfully');
        return cachedToken;
    } catch (error) {
        console.error('❌ Shiprocket auth failed:', error.response?.data || error.message);
        throw new Error('Shiprocket authentication failed');
    }
}

/**
 * Create a shipment order on Shiprocket.
 * @param {object} orderData - Order details for Shiprocket
 * @returns {Promise<object>} Shiprocket response with shipment_id, order_id, etc.
 */
export async function createShipment(orderData) {
    try {
        const token = await getToken();

        // Split customer name into first + last (Shiprocket requires both)
        const nameParts = (orderData.customer_name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Customer';
        const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '.';

        const payload = {
            order_id: orderData.order_id,
            order_date: new Date().toISOString().split('T')[0],
            pickup_location: 'Primary',
            channel_id: '',
            comment: '',

            // ── Billing (required by Shiprocket) ──
            billing_customer_name: firstName,
            billing_last_name: lastName,
            billing_address: orderData.address || '',
            billing_address_2: '',
            billing_city: orderData.city || '',
            billing_pincode: orderData.pincode || '',
            billing_state: orderData.state || 'Karnataka',
            billing_country: 'India',
            billing_email: orderData.email || 'noreply@wht.store',
            billing_phone: orderData.phone || '',

            // ── Shipping = same as billing ──
            shipping_is_billing: true,

            // ── Order items ──
            order_items: orderData.items.map(item => ({
                name: item.name,
                sku: `WHT-${item.product_id}`,
                units: item.quantity || 1,
                selling_price: item.price,
                discount: 0,
                tax: 0,
                hsn: '',
            })),

            // ── Payment & totals ──
            payment_method: orderData.payment_method || 'Prepaid',
            sub_total: orderData.sub_total,

            // ── Package dimensions (cm) & weight (kg) ──
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5,
        };

        const response = await axios.post(
            `${SHIPROCKET_BASE}/orders/create/adhoc`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log('✅ Shiprocket shipment created:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Shiprocket shipment creation failed:', error.response?.data || error.message);
        throw new Error('Shiprocket shipment creation failed');
    }
}

/**
 * Get tracking data for a shipment from Shiprocket.
 * @param {string|number} shipmentId
 * @returns {Promise<object>} Tracking info
 */
export async function getTracking(shipmentId) {
    try {
        const token = await getToken();

        const response = await axios.get(
            `${SHIPROCKET_BASE}/courier/track/shipment/${shipmentId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        return response.data;
    } catch (error) {
        console.error('❌ Shiprocket tracking fetch failed:', error.response?.data || error.message);
        throw new Error('Tracking fetch failed');
    }
}
