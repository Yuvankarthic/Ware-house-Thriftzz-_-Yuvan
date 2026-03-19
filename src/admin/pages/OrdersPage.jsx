import React, { useState, useEffect, useCallback } from 'react';
import BASE_URL from '../../config/api';
import OrderDetailPanel from '../components/OrderDetailPanel';

const API = `${BASE_URL}/api`;
const STATUSES = ['all', 'New Order', 'Accepted', 'Packing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
const PARTNERS = ['Porter', 'Rapido Parcel', 'Self Delivery'];

export default function OrdersPage({ token, user }) {
    const [orders, setOrders] = useState([]);
    const [staffList, setStaffList] = useState([]);
    
    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [deliveryFilter, setDeliveryFilter] = useState('');
    const [assignedFilter, setAssignedFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    
    const [selectedOrder, setSelectedOrder] = useState(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Fetch staff for assignment dropdown
    useEffect(() => {
        fetch(`${API}/staff`, { headers })
            .then(res => res.json())
            .then(data => { if (data.success) setStaffList(data.staff); })
            .catch(console.error);
    }, [token]);

    const fetchOrders = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (dateFilter) params.set('date', dateFilter);
            if (deliveryFilter) params.set('delivery_partner', deliveryFilter);
            if (assignedFilter) params.set('assigned_to', assignedFilter);
            if (locationFilter) params.set('city', locationFilter);
            
            const res = await fetch(`${API}/orders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setOrders(data.orders);
        } catch (err) { console.error('Fetch orders error:', err); }
    }, [search, statusFilter, dateFilter, deliveryFilter, assignedFilter, locationFilter, token]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const updateStatus = async (orderId, status) => {
        try {
            await fetch(`${API}/orders/${orderId}/status`, {
                method: 'PATCH', headers,
                body: JSON.stringify({ status }),
            });
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, order_status: status }));
            }
        } catch (err) { console.error('Status update error:', err); }
    };

    const statusClass = (s) => s.toLowerCase().replace(/\s+/g, '-');
    const isUrgent = (o) => o.order_status === 'New Order' && (Date.now() - new Date(o.created_at)) > 10 * 60 * 1000;

    const getNextAction = (status) => {
        const map = {
            'New Order': { label: 'Accept', next: 'Accepted', cls: 'primary' },
            'Accepted': { label: 'Start Packing', next: 'Packing', cls: 'warning' },
            'Packing': { label: 'Mark Packed', next: 'Packed', cls: 'primary' },
            'Packed': { label: 'Out for Delivery', next: 'Out for Delivery', cls: 'warning' },
            'Out for Delivery': { label: 'Delivered', next: 'Delivered', cls: 'success' },
        };
        return map[status];
    };

    return (
        <div>
            <div className="admin-page-header">
                <h1>Order Management</h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{orders.length} orders</span>
            </div>

            {/* Toolbar */}
            <div className="orders-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <input className="search-input" placeholder="Search ID, name, phone…"
                       value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
                
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
                </select>

                <input type="date" className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                
                <select className="filter-select" value={deliveryFilter} onChange={e => setDeliveryFilter(e.target.value)}>
                    <option value="">All Partners</option>
                    {PARTNERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select className="filter-select" value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)}>
                    <option value="">All Staff</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <input className="filter-select" placeholder="Filter by City…"
                       value={locationFilter} onChange={e => setLocationFilter(e.target.value)} />
            </div>

            {/* Table */}
            <div className="orders-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="orders-table" style={{ minWidth: '1200px' }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer Name</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Products</th>
                            <th>Value</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Delivery Partner</th>
                            <th>Created Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => {
                            const action = getNextAction(o.order_status);
                            return (
                                <tr key={o.id} className={isUrgent(o) ? 'urgent' : ''}
                                    onClick={() => setSelectedOrder(o)}>
                                    <td style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>#{o.id}</td>
                                    <td>{o.customer_name}</td>
                                    <td>{o.phone}</td>
                                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.full_address}>
                                        {o.full_address}
                                    </td>
                                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.product_name}>
                                        {o.product_name}
                                    </td>
                                    <td style={{ fontWeight: 700 }}>₹{o.order_value}</td>
                                    <td><span className="status-badge delivered">{o.payment_status}</span></td>
                                    <td><span className={`status-badge ${statusClass(o.order_status)}`}>{o.order_status}</span></td>
                                    <td style={{ color: 'var(--admin-text-muted)' }}>{o.assigned_name || '—'}</td>
                                    <td style={{ color: 'var(--admin-text-muted)' }}>{o.delivery_partner || '—'}</td>
                                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.75rem' }}>{new Date(o.created_at).toLocaleString()}</td>
                                    <td>
                                        <div className="action-btns" onClick={e => e.stopPropagation()}>
                                            {action && (
                                                <button className={`btn-admin ${action.cls}`}
                                                        onClick={() => updateStatus(o.id, action.next)}>
                                                    {action.label}
                                                </button>
                                            )}
                                            {o.order_status !== 'Cancelled' && o.order_status !== 'Delivered' && (
                                                <button className="btn-admin danger"
                                                        onClick={() => updateStatus(o.id, 'Cancelled')}>✕</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {orders.length === 0 && (
                            <tr><td colSpan={12} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No orders found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Panel */}
            {selectedOrder && (
                <OrderDetailPanel
                    orderId={selectedOrder.id}
                    token={token}
                    user={user}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={fetchOrders}
                />
            )}
        </div>
    );
}
