import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API = 'https://ware-house-thriftzz-yuvan.onrender.com/api';
const COLORS = ['#6c5ce7', '#00c853', '#ffab00', '#40c4ff', '#ff5252', '#00e5ff', '#ff9100', '#aa00ff'];

export default function AnalyticsPage({ token }) {
    const [hourly, setHourly] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [locations, setLocations] = useState([]);

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [hRes, pRes, lRes] = await Promise.all([
                    fetch(`${API}/analytics/hourly`, { headers }),
                    fetch(`${API}/analytics/top-products`, { headers }),
                    fetch(`${API}/analytics/by-location`, { headers }),
                ]);
                const hData = await hRes.json();
                const pData = await pRes.json();
                const lData = await lRes.json();

                if (hData.success) setHourly(hData.hourly);
                if (pData.success) setTopProducts(pData.products);
                if (lData.success) setLocations(lData.locations);
            } catch (err) { console.error('Analytics fetch error:', err); }
        };
        fetchAll();
    }, [token]);

    return (
        <div>
            <div className="admin-page-header">
                <h1>Analytics</h1>
            </div>

            <div className="analytics-grid">
                {/* Orders per Hour */}
                <div className="chart-card">
                    <h3>Orders Per Hour (Today)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={hourly}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2e3340" />
                            <XAxis dataKey="label" stroke="#8b8f9a" fontSize={11} />
                            <YAxis stroke="#8b8f9a" fontSize={11} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ background: '#1a1d27', border: '1px solid #2e3340', borderRadius: 8, color: '#e4e6eb' }}
                            />
                            <Bar dataKey="count" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Products */}
                <div className="chart-card">
                    <h3>Top Selling Products</h3>
                    {topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#2e3340" />
                                <XAxis type="number" stroke="#8b8f9a" fontSize={11} allowDecimals={false} />
                                <YAxis type="category" dataKey="product_name" stroke="#8b8f9a" fontSize={10} width={120} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1d27', border: '1px solid #2e3340', borderRadius: 8, color: '#e4e6eb' }}
                                />
                                <Bar dataKey="orders" fill="#00c853" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--admin-text-muted)', padding: 40, textAlign: 'center' }}>No data yet</p>
                    )}
                </div>

                {/* Orders by Location */}
                <div className="chart-card">
                    <h3>Orders by City</h3>
                    {locations.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={locations} dataKey="orders" nameKey="city" cx="50%" cy="50%"
                                     outerRadius={100} label={({ city, orders }) => `${city} (${orders})`}
                                     labelLine={false}>
                                    {locations.map((_, idx) => (
                                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1a1d27', border: '1px solid #2e3340', borderRadius: 8, color: '#e4e6eb' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--admin-text-muted)', padding: 40, textAlign: 'center' }}>No data yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
