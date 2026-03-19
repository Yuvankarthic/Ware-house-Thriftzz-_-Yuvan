import React, { useState, useEffect } from 'react';

const API = '/api';
const STATUS_FLOW = ['New Order', 'Accepted', 'Packing', 'Packed', 'Out for Delivery', 'Delivered'];

export default function OrderDetailPanel({ orderId, token, user, onClose, onUpdate }) {
    const [order, setOrder] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [deliveryPartner, setDeliveryPartner] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [riderPhone, setRiderPhone] = useState('');
    const [trackingRef, setTrackingRef] = useState('');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetchDetail();
    }, [orderId]);

    const fetchDetail = async () => {
        try {
            const res = await fetch(`${API}/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
                setTimeline(data.timeline || []);
                setDeliveryPartner(data.order.delivery_partner || '');
                setDeliveryNotes(data.order.delivery_notes || '');
                setRiderPhone(data.order.rider_phone || '');
                setTrackingRef(data.order.tracking_ref || '');
            }
        } catch (err) { console.error('Detail fetch error:', err); }
    };

    const updateStatus = async (status) => {
        try {
            await fetch(`${API}/orders/${orderId}/status`, {
                method: 'PATCH', headers,
                body: JSON.stringify({ status }),
            });
            fetchDetail();
            onUpdate?.();
        } catch (err) { console.error('Status update error:', err); }
    };

    const claimOrder = async () => {
        try {
            const res = await fetch(`${API}/orders/${orderId}/assign`, {
                method: 'PATCH', headers,
            });
            const data = await res.json();
            if (!data.success) alert(data.error);
            fetchDetail();
            onUpdate?.();
        } catch (err) { console.error('Claim error:', err); }
    };

    const saveDelivery = async () => {
        try {
            await fetch(`${API}/orders/${orderId}/delivery`, {
                method: 'PATCH', headers,
                body: JSON.stringify({
                    delivery_partner: deliveryPartner,
                    delivery_notes: deliveryNotes,
                    rider_phone: riderPhone,
                    tracking_ref: trackingRef,
                }),
            });
            fetchDetail();
            onUpdate?.();
        } catch (err) { console.error('Delivery save error:', err); }
    };

    const copyOrderDetails = () => {
        const details = `ORDER #${order.id}
═══════════════════════════════

CUSTOMER DETAILS
Name: ${order.customer_name}
Phone: ${order.phone}
Email: ${order.email || 'N/A'}

DELIVERY ADDRESS
${order.full_address}

PRODUCT DETAILS
Item: ${order.product_name}
Quantity: ${order.quantity}
Price: ₹${order.order_value}

ORDER STATUS
Current: ${order.order_status}

PAYMENT
Method: ${order.payment_method}
Status: ${order.payment_status}
Payment ID: ${order.payment_id || 'N/A'}

DELIVERY PARTNER
${deliveryPartner || 'Not assigned yet'}
Rider Phone: ${riderPhone || 'Not provided'}
Tracking Ref: ${trackingRef || 'Not provided'}

═══════════════════════════════
Prepared for: ${deliveryPartner || 'Manual booking'}
Time: ${new Date().toLocaleString()}`;

        navigator.clipboard.writeText(details).then(() => {
            alert('✅ Order details copied to clipboard!');
        }).catch(err => {
            console.error('Copy error:', err);
            alert('❌ Failed to copy details');
        });
    };

    const statusClass = (s) => s.toLowerCase().replace(/\s+/g, '-');

    if (!order) return null;

    const getNextStatus = () => {
        const idx = STATUS_FLOW.indexOf(order.order_status);
        if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
        return null;
    };

    return (
        <>
            <div className="order-detail-overlay" onClick={onClose} />
            <div className="order-detail-panel">
                <div className="detail-header">
                    <h2>Order #{order.id}</h2>
                    <button className="detail-close" onClick={onClose}>✕</button>
                </div>

                {/* Status */}
                <div className="detail-section">
                    <h3>Status</h3>
                    <span className={`status-badge ${statusClass(order.order_status)}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                        {order.order_status}
                    </span>
                </div>

                {/* Customer */}
                <div className="detail-section">
                    <h3>Customer Details</h3>
                    <div className="detail-row"><span className="label">Name</span><span className="value">{order.customer_name}</span></div>
                    <div className="detail-row"><span className="label">Phone</span><span className="value">{order.phone}</span></div>
                    <div className="detail-row"><span className="label">Email</span><span className="value">{order.email || '—'}</span></div>
                </div>

                {/* Address */}
                <div className="detail-section">
                    <h3>Delivery Address</h3>
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{order.full_address}</p>
                </div>

                {/* Product */}
                <div className="detail-section">
                    <h3>Product</h3>
                    <div className="detail-row"><span className="label">Item</span><span className="value">{order.product_name}</span></div>
                    <div className="detail-row"><span className="label">Qty</span><span className="value">{order.quantity}</span></div>
                    <div className="detail-row"><span className="label">Value</span><span className="value" style={{ color: 'var(--admin-success)', fontWeight: 800 }}>₹{order.order_value}</span></div>
                </div>

                {/* Payment */}
                <div className="detail-section">
                    <h3>Payment</h3>
                    <div className="detail-row"><span className="label">Method</span><span className="value">{order.payment_method}</span></div>
                    <div className="detail-row"><span className="label">Status</span><span className="value">{order.payment_status}</span></div>
                    <div className="detail-row"><span className="label">ID</span><span className="value" style={{ fontSize: '0.75rem' }}>{order.payment_id || '—'}</span></div>
                </div>

                {/* Assignment */}
                <div className="detail-section">
                    <h3>Staff</h3>
                    <div className="detail-row">
                        <span className="label">Assigned to</span>
                        <span className="value">{order.assigned_name || 'Unassigned'}</span>
                    </div>
                    {!order.assigned_to && (
                        <button className="btn-admin primary" style={{ marginTop: 8 }} onClick={claimOrder}>
                            🙋 Claim This Order
                        </button>
                    )}
                </div>

                {/* Delivery Management */}
                <div className="detail-section">
                    <h3>Delivery Management</h3>
                    <div className="delivery-form">
                        <select value={deliveryPartner} onChange={e => setDeliveryPartner(e.target.value)}>
                            <option value="">Select delivery partner</option>
                            <option value="Porter">Porter</option>
                            <option value="Rapido Parcel">Rapido Parcel</option>
                            <option value="Self Delivery">Self Delivery</option>
                        </select>
                        <input placeholder="Rider phone number" value={riderPhone} onChange={e => setRiderPhone(e.target.value)} />
                        <input placeholder="Tracking reference (optional)" value={trackingRef} onChange={e => setTrackingRef(e.target.value)} />
                        <textarea placeholder="Delivery notes…" value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} />
                        <button className="btn-admin primary" onClick={saveDelivery}>Save Delivery Info</button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="detail-section">
                    <h3>Order Timeline</h3>
                    <div className="timeline">
                        {timeline.map(t => (
                            <div key={t.id} className="timeline-item">
                                <div className="timeline-dot" />
                                <div className="timeline-content">
                                    <div className="status">{t.status}</div>
                                    <div className="note">{t.note}</div>
                                    <div className="time">{new Date(t.created_at).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="detail-actions">
                    <button className="btn-admin primary" onClick={copyOrderDetails} style={{ marginBottom: 8 }}>
                        📋 Copy Order Details
                    </button>
                    {getNextStatus() && (
                        <button className="btn-admin success" onClick={() => updateStatus(getNextStatus())}>
                            ➡ Move to: {getNextStatus()}
                        </button>
                    )}
                    {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
                        <button className="btn-admin danger" onClick={() => updateStatus('Cancelled')}>
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
