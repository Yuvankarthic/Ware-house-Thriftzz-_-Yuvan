import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import KanbanPage from './pages/KanbanPage';
import TeamPage from './pages/TeamPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import './styles/admin.css';

export default function AdminRoot() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('wht_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('wht_user');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    const handleLogin = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    if (loading) return null;

    if (!token) {
        return (
            <div className="admin-root">
                <Routes>
                    <Route path="login" element={<LoginPage onLogin={handleLogin} />} />
                    <Route path="*" element={<Navigate to="/admin/login" replace />} />
                </Routes>
            </div>
        );
    }

    return (
        <div className="admin-root">
            <Sidebar user={user} />
            <main className="admin-main">
                <Routes>
                    <Route index element={<DashboardPage token={token} />} />
                    <Route path="orders" element={<OrdersPage token={token} />} />
                    <Route path="kanban" element={<KanbanPage token={token} />} />
                    <Route path="team" element={<TeamPage token={token} />} />
                    <Route path="analytics" element={<AnalyticsPage token={token} />} />
                    <Route path="login" element={<Navigate to="/admin" replace />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}
