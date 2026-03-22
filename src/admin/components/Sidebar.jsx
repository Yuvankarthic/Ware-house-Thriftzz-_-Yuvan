import React from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { X } from 'lucide-react';

export default function Sidebar({ user, isOpen, onClose }) {
    const history = useHistory();

    const handleLogout = () => {
        localStorage.removeItem('wht_token');
        localStorage.removeItem('wht_user');
        history.push('/shop');
    };

    const isAdmin = user?.role === 'admin';

    const links = [
        { to: '/admin', label: 'Dashboard', icon: '📊', exact: true },
        { to: '/admin/activity', label: 'Activity', icon: '📍' },
        { to: '/admin/orders', label: 'Orders', icon: '📦' },
        { to: '/admin/products', label: 'Products', icon: '🛍️' },
        { to: '/admin/health', label: 'System Health', icon: '🩺' },
        { to: '/admin/kanban', label: 'Board', icon: '📋' },
    ];

    if (isAdmin) {
        links.push({ to: '/admin/analytics', label: 'Analytics', icon: '📈' });
        links.push({ to: '/admin/team', label: 'Team', icon: '👥' });
    }

    return (
        <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <h2>WHT</h2>
                <span>OPS</span>
                <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
                    <X size={20} />
                </button>
            </div>

            <nav className="sidebar-nav">
                {links.map(link => (
                    link.exact ? (
                        <NavLink key={link.to} to={link.to} exact activeClassName="active"
                                 onClick={onClose}>
                            <span>{link.icon}</span>
                            {link.label}
                        </NavLink>
                    ) : (
                        <NavLink key={link.to} to={link.to} activeClassName="active"
                                 onClick={onClose}>
                            <span>{link.icon}</span>
                            {link.label}
                        </NavLink>
                    )
                ))}

                <div style={{ flex: 1 }} />

                <button onClick={handleLogout} style={{ color: 'var(--admin-danger)' }}>
                    <span>🚪</span> Logout
                </button>
            </nav>

            {user && (
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {user.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="sidebar-user-info">
                        <p>{user.name}</p>
                        <span>{user.role}</span>
                    </div>
                </div>
            )}
        </aside>
    );
}
