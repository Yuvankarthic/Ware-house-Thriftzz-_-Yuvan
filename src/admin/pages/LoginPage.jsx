import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Loader2, User, Lock } from 'lucide-react';
import '../styles/admin.css';

const API = '/api';

export default function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || 'Invalid credentials. Please try again.');
                setLoading(false);
                return;
            }
            localStorage.setItem('wht_token', data.token);
            localStorage.setItem('wht_user', JSON.stringify(data.user));
            onLogin(data.user, data.token);
            navigate('/admin');
        } catch (err) {
            setError('System offline. Cannot reach operations server.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glow"></div>
            <div className="login-box">
                <div className="login-header">
                    <div className="login-brand-icon">
                        <Shield size={40} />
                    </div>
                    <h1>WHT <span>OPS</span></h1>
                    <p>Internal Operations Control Center</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error-message">
                            {error}
                        </div>
                    )}

                    <div className="input-field">
                        <label>Username / Email</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input 
                                type="text" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your identity" 
                                required 
                                autoFocus 
                            />
                        </div>
                    </div>

                    <div className="input-field">
                        <label>Security Key</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? (
                            <Loader2 className="spinner" size={20} />
                        ) : (
                            <>
                                Access Control Center <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="status-indicator">
                        <span className="dot pulse"></span>
                        SYSTEM STATUS: ONLINE
                    </div>
                </div>
            </div>
        </div>
    );
}
