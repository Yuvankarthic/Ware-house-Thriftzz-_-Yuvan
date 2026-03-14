import React from 'react';

export default function MetricCard({ icon, value, label, color = 'purple' }) {
    return (
        <div className={`metric-card ${color}`}>
            <div className="metric-icon">{icon}</div>
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
        </div>
    );
}
