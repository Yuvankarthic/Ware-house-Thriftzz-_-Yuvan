import React, { useEffect, useMemo, useState } from 'react';
import BASE_URL from '../../config/api';
import MetricCard from '../components/MetricCard';

const API = `${BASE_URL}/api`;

const labelForEvent = (eventType) => {
    const map = {
        page_visit: 'User visited page',
        product_view: 'Viewed product',
        add_to_cart: 'Added to cart',
        buy_now: 'Clicked Buy Now',
        order_placed: 'Order placed',
        order_synced: 'Order synced',
    };
    return map[eventType] || eventType.replace(/_/g, ' ');
};

export default function ActivityPage({ token }) {
    const [summary, setSummary] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const fetchData = async () => {
        try {
            setError('');
            const [summaryRes, logsRes] = await Promise.all([
                fetch(`${API}/activity-summary`, { headers }),
                fetch(`${API}/activity-logs?limit=100`, { headers }),
            ]);

            if (!summaryRes.ok || !logsRes.ok) {
                throw new Error('Unable to load activity data');
            }

            const summaryData = await summaryRes.json();
            const logsData = await logsRes.json();

            if (summaryData.success) {
                setSummary(summaryData.summary);
            }
            if (logsData.success) {
                setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
            }
        } catch (err) {
            setError(err.message || 'Failed to load activity dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 15000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <div className="admin-page-header">
                <h1>Activity Dashboard</h1>
                <p className="admin-subtle">Lightweight traffic and conversion monitoring.</p>
            </div>

            {error && <div className="activity-error">{error}</div>}

            <div className="metrics-grid">
                <MetricCard icon="👥" value={summary?.visitors_today ?? (loading ? '...' : 0)} label="Visitors Today" color="blue" />
                <MetricCard icon="🌐" value={summary?.total_visits ?? (loading ? '...' : 0)} label="Total Visits" color="cyan" />
                <MetricCard icon="🛒" value={summary?.orders_today ?? (loading ? '...' : 0)} label="Orders Today" color="green" />
                <MetricCard icon="📈" value={summary ? `${summary.conversion_rate}%` : (loading ? '...' : '0%')} label="Conversion Rate" color="yellow" />
            </div>

            <section className="activity-log-panel">
                <div className="activity-log-header">
                    <h2>Recent Activity</h2>
                    <button type="button" className="btn-admin ghost" onClick={fetchData}>Refresh</button>
                </div>

                <div className="activity-log-list">
                    {logs.length === 0 && !loading && (
                        <p className="activity-empty">No recent activity yet.</p>
                    )}

                    {logs.map((entry) => (
                        <div key={entry.id} className="activity-log-item">
                            <span className="activity-time">{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="activity-message">
                                {labelForEvent(entry.event_type)}
                                {entry.page ? ` - ${entry.page}` : ''}
                                {entry.product_id ? ` (Product ${entry.product_id})` : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
