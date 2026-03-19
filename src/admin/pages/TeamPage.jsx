import React, { useState, useEffect } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

export default function TeamPage({ token, user }) {
    const [staff, setStaff] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('staff');
    const [error, setError] = useState('');

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchStaff = async () => {
        try {
            const res = await fetch(`${API}/staff`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setStaff(data.staff);
        } catch (err) { console.error('Staff fetch error:', err); }
    };

    useEffect(() => { fetchStaff(); }, [token]);

    const addStaff = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API}/auth/register`, {
                method: 'POST', headers,
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.error); return; }
            setName(''); setEmail(''); setPassword(''); setRole('staff');
            fetchStaff();
        } catch (err) { setError('Failed to add staff'); }
    };

    const removeStaff = async (id) => {
        if (!confirm('Remove this staff member?')) return;
        try {
            await fetch(`${API}/staff/${id}`, { method: 'DELETE', headers });
            fetchStaff();
        } catch (err) { console.error('Remove error:', err); }
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div>
            <div className="admin-page-header">
                <h1>Team Management</h1>
            </div>

            {/* Add Staff Form (admin only) */}
            {isAdmin && (
                <>
                    {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}
                    <form className="add-staff-form" onSubmit={addStaff}>
                        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <select value={role} onChange={e => setRole(e.target.value)}>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className="btn-admin primary">Add Staff</button>
                    </form>
                </>
            )}

            {/* Staff Table */}
            <div className="team-table-wrapper">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 700 }}>#{s.id}</td>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                                <td>
                                    <span className={`status-badge ${s.role === 'admin' ? 'accepted' : 'packed'}`}>
                                        {s.role}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                {isAdmin && (
                                    <td>
                                        {s.id !== user.id && (
                                            <button className="btn-admin danger" onClick={() => removeStaff(s.id)}>Remove</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
