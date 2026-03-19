import React, { useState, useEffect } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
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
                <Switch>
                    <Route path="/admin/login" render={() => <LoginPage onLogin={handleLogin} />} />
                    <Redirect to="/admin/login" />
                </Switch>
            </div>
        );
    }

    return (
        <div className="admin-root">
            <Sidebar user={user} />
            <main className="admin-main">
                <Switch>
                    <Route exact path="/admin" render={() => <DashboardPage token={token} />} />
                    <Route path="/admin/orders" render={() => <OrdersPage token={token} />} />
                    <Route path="/admin/kanban" render={() => <KanbanPage token={token} />} />
                    <Route path="/admin/team" render={() => <TeamPage token={token} />} />
                    <Route path="/admin/analytics" render={() => <AnalyticsPage token={token} />} />
                    <Redirect to="/admin" />
                </Switch>
            </main>
        </div>
    );
}
