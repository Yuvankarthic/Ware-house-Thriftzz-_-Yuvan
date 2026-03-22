import React, { useState, useEffect, useRef } from 'react';
import BASE_URL from '../../config/api';
import MetricCard from '../components/MetricCard';
import { Wifi, WifiOff } from 'lucide-react';

const API = `${BASE_URL}/api`;

export default function DashboardPage({ token }) {
    const [metrics, setMetrics] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [toast, setToast] = useState(null);
    const [systemOnline, setSystemOnline] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const prevCountRef = useRef(0);
    const audioRef = useRef(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
        try {
            const [mRes, oRes] = await Promise.all([
                fetch(`${API}/analytics/overview`, { headers }),
                fetch(`${API}/orders?limit=8`, { headers }),
            ]);
            
            if (!mRes.ok || !oRes.ok) throw new Error('API error');
            
            const mData = await mRes.json();
            const oData = await oRes.json();

            if (mData.success) {
                // Check for new orders comparing current count to stored previous count
                const newCount = mData.metrics.total_orders_today;
                if (prevCountRef.current > 0 && newCount > prevCountRef.current) {
                    setToast(`🚀 ACTION REQUIRED: ${newCount - prevCountRef.current} new order(s) received!`);
                    try { 
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            audioRef.current.play(); 
                        }
                    } catch (e) { console.warn('Audio play failed', e); }
                    setTimeout(() => setToast(null), 5000);
                }
                prevCountRef.current = newCount;
                setMetrics(mData.metrics);
            }
            if (oData.success) setRecentOrders(oData.orders);
            
            setSystemOnline(true);
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setSystemOnline(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Dashboard stays live, but less aggressive to reduce UI churn
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const statusClass = (s) => s.toLowerCase().replace(/\s+/g, '-');
    const isUrgent = (createdAt) => (Date.now() - new Date(createdAt)) > 10 * 60 * 1000;

    return (
        <div>
            {/* Hidden audio for notifications */}
            <audio ref={audioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" type="audio/wav" />
            </audio>

            {toast && <div className="new-order-toast">{toast}</div>}

            <div className="admin-page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <h1>Dashboard</h1>
                    <div className="system-status-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {systemOnline ? (
                            <>
                                <Wifi size={16} style={{ color: '#0ECC6Dff', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                <span style={{ color: '#0ECC6Dff', fontSize: '0.82rem', fontWeight: 600 }}>System Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={16} style={{ color: '#FF6B6Bff' }} />
                                <span style={{ color: '#FF6B6Bff', fontSize: '0.82rem', fontWeight: 600 }}>Offline</span>
                            </>
                        )}
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.72rem', marginLeft: '12px' }}>
                            Last update: {lastUpdate.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                        backgroundColor: '#0ECC6D', 
                        color: '#000', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        animation: 'pulse 2s ease-in-out infinite',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        ⚡ REAL TIME
                    </span>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>
                        • Live sync every 3s • Updates: {lastUpdate.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                <MetricCard icon="📦" value={metrics?.total_orders_today ?? '—'} label="Total Orders Today" color="purple" />
                <MetricCard icon="⏳" value={metrics?.pending_orders ?? '—'} label="Pending Orders" color="yellow" />
                <MetricCard icon="📋" value={metrics?.packing_orders ?? '—'} label="Being Packed" color="blue" />
                <MetricCard icon="🚗" value={metrics?.out_for_delivery ?? '—'} label="Out for Delivery" color="cyan" />
                <MetricCard icon="✅" value={metrics?.delivered_today ?? '—'} label="Delivered Today" color="green" />
                <MetricCard icon="💰" value={metrics ? `₹${metrics.revenue_today}` : '—'} label="Revenue Today" color="green" />
            </div>

            {/* Recent Orders */}
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>Recent Orders</h2>
            <div className="orders-table-wrapper" style={{ maxHeight: 400 }}>
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map(o => (
                            <tr key={o.id} className={o.order_status === 'New Order' && isUrgent(o.created_at) ? 'urgent' : ''}>
                                <td style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>{o.id}</td>
                                <td>{o.customer_name}</td>
                                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.product_name}</td>
                                <td style={{ fontWeight: 700 }}>₹{o.order_value}</td>
                                <td><span className={`status-badge ${statusClass(o.order_status)}`}>{o.order_status}</span></td>
                                <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(o.created_at).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                        {recentOrders.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No orders yet today</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
