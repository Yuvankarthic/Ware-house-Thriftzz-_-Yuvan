import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;
const STATUS_MAIL_ALLOWED = ['Packed', 'Out for Delivery', 'Delivered'];

const normalizeMailState = (value) => {
    const state = String(value || '').toLowerCase();
    if (state === 'sent') return 'ok';
    if (state === 'failed') return 'down';
    if (state === 'skipped' || state === 'pending') return 'warning';
    return 'warning';
};

const mailStateLabel = (value) => {
    const state = String(value || '').toLowerCase();
    if (state === 'sent') return 'Sent';
    if (state === 'failed') return 'Failed';
    if (state === 'skipped') return 'Skipped';
    if (state === 'pending') return 'Pending';
    return 'Unknown';
};

const eventLabel = (value) => {
    if (value === 'packed') return 'Packed';
    if (value === 'out_for_delivery') return 'Out for Delivery';
    if (value === 'delivered') return 'Delivered';
    return 'N/A';
};

export default function EmailPage({ token }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [recipientOverride, setRecipientOverride] = useState('');
    const [sending, setSending] = useState({});
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('order_confirmation');
    const [manualRecipient, setManualRecipient] = useState('');

    const headers = useMemo(
        () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
        [token]
    );

    const fetchRows = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            params.set('limit', '200');
            if (search.trim()) params.set('search', search.trim());

            const res = await fetch(`${API}/orders/email-dashboard?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data?.error || 'Failed to fetch email dashboard');
            }

            setRows(Array.isArray(data.rows) ? data.rows : []);
        } catch (err) {
            setError(err.message || 'Failed to fetch email dashboard');
        } finally {
            setLoading(false);
        }
    }, [search, token]);

    useEffect(() => {
        fetchRows();
        const intervalId = setInterval(fetchRows, 30000);
        return () => clearInterval(intervalId);
    }, [fetchRows]);

    const triggerMail = async ({ orderId, type, status }) => {
        const actionKey = `${orderId}:${type}`;
        setSending((prev) => ({ ...prev, [actionKey]: true }));
        try {
            const res = await fetch(`${API}/orders/${orderId}/email/resend`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type,
                    status,
                    recipient_override: recipientOverride.trim() || undefined,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data?.error || 'Failed to send email');
            }

            await fetchRows();
            alert(`Email sent successfully for order #${orderId} to ${data?.recipient || 'recipient'}`);
        } catch (err) {
            alert(err.message || 'Failed to send email');
        } finally {
            setSending((prev) => ({ ...prev, [actionKey]: false }));
        }
    };

    const triggerMailWithOverride = async ({ orderId, type, status, recipientOverrideValue }) => {
        const actionKey = `${orderId}:${type}:manual`;
        setSending((prev) => ({ ...prev, [actionKey]: true }));
        try {
            const res = await fetch(`${API}/orders/${orderId}/email/resend`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type,
                    status,
                    recipient_override: String(recipientOverrideValue || '').trim() || undefined,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data?.error || 'Failed to send email');
            }

            await fetchRows();
            alert(`Email sent successfully for order #${orderId} to ${data?.recipient || 'recipient'}`);
        } catch (err) {
            alert(err.message || 'Failed to send email');
        } finally {
            setSending((prev) => ({ ...prev, [actionKey]: false }));
        }
    };

    return (
        <div>
            <div className="admin-page-header">
                <h1>Email Center</h1>
                <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                    Order email live status + manual resend backup
                </span>
            </div>

            <div className="email-center-toolbar">
                <input
                    className="search-input"
                    placeholder="Search by order ID, customer, email, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <input
                    className="search-input"
                    placeholder="Optional: send to this email instead"
                    value={recipientOverride}
                    onChange={(e) => setRecipientOverride(e.target.value)}
                />
                <button className="btn-admin primary" onClick={fetchRows} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <section className="health-log-card" style={{ marginBottom: '14px' }}>
                <h2>Manual Mail Sender</h2>
                <div className="email-manual-grid">
                    <select
                        className="filter-select"
                        value={selectedOrderId}
                        onChange={(e) => {
                            const orderId = e.target.value;
                            setSelectedOrderId(orderId);
                            const selected = rows.find((row) => String(row.id) === String(orderId));
                            if (selected?.email) {
                                setManualRecipient(selected.email);
                            }
                        }}
                    >
                        <option value="">Select customer/order</option>
                        {rows.map((row) => (
                            <option key={row.id} value={row.id}>
                                #{row.id} - {row.customer_name || 'Customer'} - {row.email || 'No email'}
                            </option>
                        ))}
                    </select>

                    <select
                        className="filter-select"
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                        <option value="order_confirmation">Order Mail</option>
                        <option value="packed">Packed Mail</option>
                        <option value="out_for_delivery">Out for Delivery Mail</option>
                        <option value="delivered">Delivered Mail</option>
                    </select>

                    <input
                        className="search-input"
                        placeholder="Recipient email"
                        value={manualRecipient}
                        onChange={(e) => setManualRecipient(e.target.value)}
                    />

                    <button
                        className="btn-admin success"
                        onClick={async () => {
                            const orderId = Number.parseInt(String(selectedOrderId), 10);
                            if (!Number.isInteger(orderId)) {
                                alert('Please select an order/user first.');
                                return;
                            }

                            const statusMap = {
                                packed: 'Packed',
                                out_for_delivery: 'Out for Delivery',
                                delivered: 'Delivered',
                            };

                            const isConfirmation = selectedTemplate === 'order_confirmation';
                            const type = isConfirmation ? 'order_confirmation' : 'status_update';
                            const status = isConfirmation ? undefined : statusMap[selectedTemplate];

                            await triggerMailWithOverride({
                                orderId,
                                type,
                                status,
                                recipientOverrideValue: manualRecipient,
                            });
                        }}
                        disabled={Boolean(sending[`${selectedOrderId}:${selectedTemplate === 'order_confirmation' ? 'order_confirmation' : 'status_update'}:manual`])}
                    >
                        {sending[`${selectedOrderId}:${selectedTemplate === 'order_confirmation' ? 'order_confirmation' : 'status_update'}:manual`] ? 'Sending...' : 'Send Manual Mail'}
                    </button>
                </div>
            </section>

            <p className="email-center-tip">
                Leave override empty to send to customer email. Fill override to send a manual copy to another email.
            </p>

            {error && <p className="email-center-error">{error}</p>}

            <div className="orders-table-wrapper email-center-table-wrap">
                <table className="orders-table email-center-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Order Status</th>
                            <th>Confirmation Mail</th>
                            <th>Status Update Mail</th>
                            <th>Last Attempt</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const confirmationState = normalizeMailState(row.confirmation_status);
                            const statusState = normalizeMailState(row.status_email_status);
                            const canSendStatus = STATUS_MAIL_ALLOWED.includes(String(row.order_status || ''));
                            const confirmationActionKey = `${row.id}:order_confirmation`;
                            const statusActionKey = `${row.id}:status_update`;
                            const lastAttempt = row.status_email_last_attempt || row.confirmation_last_attempt;

                            return (
                                <tr key={row.id}>
                                    <td style={{ fontWeight: 700 }}>#{row.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{row.customer_name || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{row.phone || 'No phone'}</div>
                                    </td>
                                    <td>{row.email || 'No email'}</td>
                                    <td>{row.order_status || 'N/A'}</td>
                                    <td>
                                        <span className={`mail-status-badge ${confirmationState}`}>
                                            {mailStateLabel(row.confirmation_status)}
                                        </span>
                                        {row.confirmation_reason && (
                                            <p className="mail-status-reason">{row.confirmation_reason}</p>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`mail-status-badge ${statusState}`}>
                                            {eventLabel(row.status_event_type)} · {mailStateLabel(row.status_email_status || 'pending')}
                                        </span>
                                        {row.status_email_reason && (
                                            <p className="mail-status-reason">{row.status_email_reason}</p>
                                        )}
                                    </td>
                                    <td>
                                        {lastAttempt ? new Date(lastAttempt).toLocaleString() : 'N/A'}
                                    </td>
                                    <td>
                                        <div className="email-actions">
                                            <button
                                                className="btn-admin primary"
                                                onClick={() => triggerMail({ orderId: row.id, type: 'order_confirmation' })}
                                                disabled={!row.email || Boolean(sending[confirmationActionKey])}
                                            >
                                                {sending[confirmationActionKey] ? 'Sending...' : 'Resend Order Mail'}
                                            </button>
                                            <button
                                                className="btn-admin success"
                                                onClick={() => triggerMail({ orderId: row.id, type: 'status_update', status: row.order_status })}
                                                disabled={!row.email || !canSendStatus || Boolean(sending[statusActionKey])}
                                            >
                                                {sending[statusActionKey] ? 'Sending...' : 'Send Status Mail'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {rows.length === 0 && !loading && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-text-muted)' }}>
                                    No email records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
