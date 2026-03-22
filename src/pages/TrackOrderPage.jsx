import React, { useState } from 'react';
import BASE_URL from '../config/api';
import '../styles/TrackOrderPage.css';

const API = `${BASE_URL}/api`;

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const trackOrder = async () => {
        if (!orderId.trim() || !phone.trim()) {
            setError('Please enter order ID and phone number.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${API}/track-order?order_id=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phone.trim())}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || 'Invalid order details');
                return;
            }

            setResult(data);
        } catch (_err) {
            setError('Could not reach server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="track-page">
            <section className="track-card container">
                <h1>Track Your Order</h1>
                <p>Enter your order ID and phone number used at checkout.</p>

                <div className="track-form">
                    <input
                        type="text"
                        placeholder="Order ID (example: 181001)"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                    />
                    <input
                        type="tel"
                        placeholder="Phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button type="button" onClick={trackOrder} disabled={loading}>
                        {loading ? 'Checking...' : 'Track Order'}
                    </button>
                </div>

                {error && <p className="track-error">{error}</p>}

                {result?.order_id && (
                    <div className="track-result">
                        <div className="track-summary">
                            <h2>Order {result.order_id}</h2>
                            <p>{result.product_name}</p>
                            <p>Status: <strong>{result.status}</strong></p>
                            <p>Order Status: <strong>{result.order_status}</strong></p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
