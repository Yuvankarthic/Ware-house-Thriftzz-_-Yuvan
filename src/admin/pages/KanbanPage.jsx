import React, { useState, useEffect, useCallback } from 'react';

const API = '/api';
const COLUMNS = ['New Order', 'Accepted', 'Packing', 'Packed', 'Out for Delivery', 'Delivered'];

export default function KanbanPage({ token }) {
    const [orders, setOrders] = useState([]);
    const [dragItem, setDragItem] = useState(null);
    const [dragOverCol, setDragOverCol] = useState(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch(`${API}/orders?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setOrders(data.orders.filter(o => o.order_status !== 'Cancelled'));
        } catch (err) { console.error('Kanban fetch error:', err); }
    }, [token]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const getColumnOrders = (status) => orders.filter(o => o.order_status === status);

    const handleDragStart = (e, order) => {
        setDragItem(order);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, status) => {
        e.preventDefault();
        setDragOverCol(status);
    };

    const handleDragLeave = () => setDragOverCol(null);

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        setDragOverCol(null);
        if (!dragItem || dragItem.order_status === targetStatus) return;

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === dragItem.id ? { ...o, order_status: targetStatus } : o));

        try {
            await fetch(`${API}/orders/${dragItem.id}/status`, {
                method: 'PATCH', headers,
                body: JSON.stringify({ status: targetStatus }),
            });
        } catch (err) {
            console.error('Drop status update error:', err);
            fetchOrders(); // Revert on error
        }
        setDragItem(null);
    };

    const isUrgent = (o) => o.order_status === 'New Order' && (Date.now() - new Date(o.created_at)) > 10 * 60 * 1000;
    const timeAgo = (d) => {
        const mins = Math.floor((Date.now() - new Date(d)) / 60000);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
    };

    return (
        <div>
            <div className="admin-page-header">
                <h1>Order Board</h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    Drag orders between columns
                </span>
            </div>

            <div className="kanban-board">
                {COLUMNS.map(status => {
                    const colOrders = getColumnOrders(status);
                    return (
                        <div key={status}
                             className={`kanban-column ${dragOverCol === status ? 'drag-over' : ''}`}
                             onDragOver={(e) => handleDragOver(e, status)}
                             onDragLeave={handleDragLeave}
                             onDrop={(e) => handleDrop(e, status)}>

                            <div className="kanban-column-header">
                                <span>{status}</span>
                                <span className="count">{colOrders.length}</span>
                            </div>

                            <div className="kanban-column-body">
                                {colOrders.map(o => (
                                    <div key={o.id}
                                         className={`kanban-card ${isUrgent(o) ? 'urgent' : ''} ${dragItem?.id === o.id ? 'dragging' : ''}`}
                                         draggable
                                         onDragStart={(e) => handleDragStart(e, o)}>
                                        <div className="card-order-id">#{o.id}</div>
                                        <div className="card-customer">{o.customer_name}</div>
                                        <div className="card-product">{o.product_name}</div>
                                        <div className="card-value">₹{o.order_value}</div>
                                        <div className="card-time">{timeAgo(o.created_at)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
