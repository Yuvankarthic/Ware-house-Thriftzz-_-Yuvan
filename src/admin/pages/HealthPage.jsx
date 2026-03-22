import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

const statusMeta = {
    ok: { icon: '✅', className: 'ok', label: 'OK' },
    warning: { icon: '⚠️', className: 'warning', label: 'Warning' },
    down: { icon: '❌', className: 'down', label: 'Down' },
};

const formatDateInput = (date = new Date()) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function HealthPage({ token }) {
    const [checking, setChecking] = useState(false);
    const [lastCheckedAt, setLastCheckedAt] = useState(null);
    const [statuses, setStatuses] = useState({
        frontend: 'ok',
        backend: 'warning',
        database: 'warning',
        api: 'warning',
        mailer: 'warning',
    });
    const [healthMessage, setHealthMessage] = useState('Waiting for first system check...');
    const [healthDetails, setHealthDetails] = useState({
        apiMs: null,
        endpoint: `${BASE_URL}/health`,
        backendTimestamp: null,
        database: 'unknown',
        checkedAtIso: null,
        error: null,
        mailerStatus: 'unknown',
        mailerFrom: 'unknown',
        mailerHost: 'unknown',
        mailerPort: 'unknown',
    });

    const [logs, setLogs] = useState([]);
    const [savingLog, setSavingLog] = useState(false);
    const [logForm, setLogForm] = useState({
        date: formatDateInput(),
        status: 'OK',
        notes: '',
    });

    const headers = useMemo(
        () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
        [token]
    );

    const fetchLogs = useCallback(async () => {
        try {
            const res = await fetch(`${API}/operations/logs`, { headers });
            const data = await res.json();
            if (res.ok && data.success) {
                setLogs(data.logs || []);
            }
        } catch (_error) {
            // Keep page usable even if logs endpoint has transient failure.
        }
    }, [headers]);

    const runHealthCheck = useCallback(async () => {
        setChecking(true);
        try {
            const start = performance.now();
            const res = await fetch(`${BASE_URL}/health`);
            const data = await res.json();
            const apiMs = Math.round(performance.now() - start);

            const backendOk = res.ok && data?.status === 'ok';
            const databaseOk = String(data?.database || '').toLowerCase() === 'connected';
            const rawMailerStatus = String(data?.mailer?.status || '').toLowerCase();
            const mailerOk = rawMailerStatus === 'online';

            setStatuses({
                frontend: 'ok',
                backend: backendOk ? 'ok' : 'down',
                database: databaseOk ? 'ok' : (backendOk ? 'warning' : 'down'),
                api: res.ok ? 'ok' : 'down',
                mailer: mailerOk ? 'ok' : (backendOk ? 'warning' : 'down'),
            });

            setHealthMessage(
                backendOk
                    ? `System healthy. Database: ${data?.database || 'unknown'}.`
                    : 'Backend health check failed. Please inspect server logs.'
            );

            setHealthDetails({
                apiMs,
                endpoint: `${BASE_URL}/health`,
                backendTimestamp: data?.timestamp || null,
                database: data?.database || 'unknown',
                checkedAtIso: new Date().toISOString(),
                error: null,
                mailerStatus: data?.mailer?.status || 'unknown',
                mailerFrom: data?.mailer?.from || 'unknown',
                mailerHost: data?.mailer?.host || 'unknown',
                mailerPort: data?.mailer?.port || 'unknown',
            });
            setLastCheckedAt(new Date());
        } catch (_error) {
            setStatuses({ frontend: 'ok', backend: 'down', database: 'down', api: 'down', mailer: 'down' });
            setHealthMessage('Unable to reach backend API.');
            setHealthDetails((prev) => ({
                ...prev,
                apiMs: null,
                checkedAtIso: new Date().toISOString(),
                error: 'Network error while reaching /health',
                mailerStatus: 'down',
            }));
            setLastCheckedAt(new Date());
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        runHealthCheck();
        fetchLogs();

        const intervalId = setInterval(runHealthCheck, 30000);
        return () => clearInterval(intervalId);
    }, [runHealthCheck, fetchLogs]);

    const saveLog = async () => {
        if (!logForm.date) return;

        setSavingLog(true);
        try {
            const res = await fetch(`${API}/operations/logs`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    date: logForm.date,
                    status: logForm.status,
                    notes: logForm.notes,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data?.error || 'Failed to save log');
            }

            setLogForm((prev) => ({ ...prev, notes: '' }));
            setLogs((prev) => [data.log, ...prev].slice(0, 100));
        } catch (error) {
            alert(error.message || 'Failed to save daily check log');
        } finally {
            setSavingLog(false);
        }
    };

    const statusCards = [
        { key: 'frontend', label: 'Frontend Status', value: 'Live', state: statuses.frontend },
        { key: 'backend', label: 'Backend Status', value: statuses.backend === 'ok' ? 'Online' : 'Unavailable', state: statuses.backend },
        { key: 'database', label: 'Database Status', value: statuses.database === 'ok' ? 'Connected' : 'Check Required', state: statuses.database },
        {
            key: 'api',
            label: 'API Status',
            value: statuses.api === 'ok'
                ? `Reachable${typeof healthDetails.apiMs === 'number' ? ` (${healthDetails.apiMs} ms)` : ''}`
                : 'Unavailable',
            state: statuses.api
        },
        {
            key: 'mailer',
            label: 'Email Sending Machine',
            value: statuses.mailer === 'ok' ? 'Online' : (statuses.mailer === 'warning' ? 'Needs Setup' : 'Down'),
            state: statuses.mailer
        },
    ];

    return (
        <div>
            <div className="admin-page-header">
                <h1>System Health / Operations</h1>
                <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem' }}>
                    {lastCheckedAt ? `Last checked: ${lastCheckedAt.toLocaleString()}` : 'Not checked yet'}
                </span>
            </div>

            <div className="health-status-grid">
                {statusCards.map((item) => {
                    const meta = statusMeta[item.state] || statusMeta.warning;
                    return (
                        <article key={item.key} className={`health-status-card ${meta.className}`}>
                            <p className="health-status-label">{item.label}</p>
                            <div className="health-status-main">
                                <span className="health-status-icon">{meta.icon}</span>
                                <strong>{item.value}</strong>
                            </div>
                            <span className="health-status-sub">{meta.label}</span>
                        </article>
                    );
                })}
            </div>

            <div className="health-actions-card">
                <p>{healthMessage}</p>
                <button className="btn-admin primary" onClick={runHealthCheck} disabled={checking}>
                    {checking ? 'Checking...' : 'Run Health Check'}
                </button>
            </div>

            <section className="health-details-card">
                <h2>Health Details</h2>
                <div className="health-details-grid">
                    <div>
                        <span>Endpoint</span>
                        <strong>{healthDetails.endpoint}</strong>
                    </div>
                    <div>
                        <span>API Response Time</span>
                        <strong>{typeof healthDetails.apiMs === 'number' ? `${healthDetails.apiMs} ms` : 'N/A'}</strong>
                    </div>
                    <div>
                        <span>Database</span>
                        <strong>{String(healthDetails.database || 'unknown')}</strong>
                    </div>
                    <div>
                        <span>Backend Timestamp</span>
                        <strong>{healthDetails.backendTimestamp ? new Date(healthDetails.backendTimestamp).toLocaleString() : 'N/A'}</strong>
                    </div>
                    <div>
                        <span>Local Checked At</span>
                        <strong>{healthDetails.checkedAtIso ? new Date(healthDetails.checkedAtIso).toLocaleString() : 'N/A'}</strong>
                    </div>
                    <div>
                        <span>Last Error</span>
                        <strong>{healthDetails.error || 'None'}</strong>
                    </div>
                    <div>
                        <span>Email Machine Status</span>
                        <strong>{String(healthDetails.mailerStatus || 'unknown')}</strong>
                    </div>
                    <div>
                        <span>Email Sender</span>
                        <strong>{String(healthDetails.mailerFrom || 'unknown')}</strong>
                    </div>
                    <div>
                        <span>SMTP Host</span>
                        <strong>{String(healthDetails.mailerHost || 'unknown')}</strong>
                    </div>
                    <div>
                        <span>SMTP Port</span>
                        <strong>{String(healthDetails.mailerPort || 'unknown')}</strong>
                    </div>
                </div>
            </section>

            <section className="health-log-card">
                <h2>Daily Check Log</h2>

                <div className="health-log-form">
                    <input
                        type="date"
                        className="filter-select"
                        value={logForm.date}
                        onChange={(e) => setLogForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                    <select
                        className="filter-select"
                        value={logForm.status}
                        onChange={(e) => setLogForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="OK">OK</option>
                        <option value="ISSUE">Issue</option>
                    </select>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Add operations note..."
                        value={logForm.notes}
                        onChange={(e) => setLogForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                    <button className="btn-admin success" onClick={saveLog} disabled={savingLog}>
                        {savingLog ? 'Saving...' : 'Save'}
                    </button>
                </div>

                <div className="health-log-list">
                    {logs.length === 0 && <p className="health-log-empty">No logs yet.</p>}
                    {logs.map((log) => (
                        <div key={log.id} className="health-log-item">
                            <div>
                                <strong>{new Date(log.check_date).toLocaleDateString()}</strong>
                                <p>{log.notes || 'No notes added.'}</p>
                            </div>
                            <span className={`health-log-badge ${String(log.status).toLowerCase()}`}>
                                {String(log.status).toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
