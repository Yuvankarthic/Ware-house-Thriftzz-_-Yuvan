import React, { useState, useEffect } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

export default function OfficersPage({ token }) {
    const [ceoInsight, setCeoInsight] = useState(null);
    const [cmoInsight, setCmoInsight] = useState(null);
    const [cfoInsight, setCfoInsight] = useState(null);
    const [ceoLoading, setCeoLoading] = useState(true);
    const [cmoLoading, setCmoLoading] = useState(true);
    const [cfoLoading, setCfoLoading] = useState(true);
    const headers = { Authorization: `Bearer ${token}` };

    const fetchCEO = () => {
        setCeoLoading(true);
        fetch(`${API}/ai/ceo`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data.success) setCeoInsight(data.insight);
            })
            .catch(() => {})
            .finally(() => setCeoLoading(false));
    };

    const fetchCMO = () => {
        setCmoLoading(true);
        fetch(`${API}/ai/cmo`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data.success) setCmoInsight(data.insight);
            })
            .catch(() => {})
            .finally(() => setCmoLoading(false));
    };

    const fetchCFO = () => {
        setCfoLoading(true);
        fetch(`${API}/ai/cfo`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data.success) setCfoInsight(data.insight);
            })
            .catch(() => {})
            .finally(() => setCfoLoading(false));
    };

    useEffect(() => {
        fetchCEO();
        fetchCMO();
        fetchCFO();
    }, []);

    const cardStyle = {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid #3b82f6',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    };

    const titleStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    };

    const labelStyle = {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#fff',
        margin: 0,
    };

    const contentStyle = {
        color: '#e2e8f0',
        fontSize: '0.95rem',
        lineHeight: 1.6,
    };

    const placeholderStyle = {
        color: '#64748b',
        fontSize: '0.9rem',
    };

    const refreshBtn = (onClick) => (
        <button
            onClick={onClick}
            style={{
                marginLeft: 'auto',
                background: 'transparent',
                border: '1px solid #475569',
                color: '#94a3b8',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '0.75rem',
            }}
        >
            ↻ Refresh
        </button>
    );

    return (
        <div>
            <div className="admin-page-header">
                <h1>👑 Chief Officers Cabin</h1>
            </div>

            {/* CEO Card */}
            <div style={cardStyle}>
                <div style={titleStyle}>
                    <span style={{ fontSize: '1.2rem' }}>👑</span>
                    <h3 style={labelStyle}>CEO Insights</h3>
                    {refreshBtn(fetchCEO)}
                </div>
                {ceoLoading ? (
                    <p style={placeholderStyle}>CEO is analyzing...</p>
                ) : ceoInsight ? (
                    <p style={contentStyle}>{ceoInsight}</p>
                ) : (
                    <p style={placeholderStyle}>No insights available</p>
                )}
            </div>

            {/* CMO Card */}
            <div style={{ ...cardStyle, borderColor: '#f59e0b' }}>
                <div style={titleStyle}>
                    <span style={{ fontSize: '1.2rem' }}>📢</span>
                    <h3 style={{ ...labelStyle, color: '#fcd34d' }}>CMO Insights</h3>
                    {refreshBtn(fetchCMO)}
                </div>
                {cmoLoading ? (
                    <p style={placeholderStyle}>CMO is planning campaigns...</p>
                ) : cmoInsight ? (
                    <p style={contentStyle}>{cmoInsight}</p>
                ) : (
                    <p style={placeholderStyle}>No insights available</p>
                )}
            </div>

            {/* CFO Card */}
            <div style={{ ...cardStyle, borderColor: '#10b981' }}>
                <div style={titleStyle}>
                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                    <h3 style={{ ...labelStyle, color: '#34d399' }}>CFO Insights</h3>
                    {refreshBtn(fetchCFO)}
                </div>
                {cfoLoading ? (
                    <p style={placeholderStyle}>CFO is analyzing finances...</p>
                ) : cfoInsight ? (
                    <p style={contentStyle}>{cfoInsight}</p>
                ) : (
                    <p style={placeholderStyle}>No insights available</p>
                )}
            </div>
        </div>
    );
}