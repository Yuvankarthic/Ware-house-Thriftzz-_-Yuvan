import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import '../styles/admin.css';

const API = '/api';

export default function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const history = useHistory();

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
            history.push('/admin');
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
                        <ShoppingBag size={32} />
                    </div>
                    <h1>WHT Fashion</h1>
                    <p>Admin Portal</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error-message">
                            {error}
                        </div>
                    )}

                    <div className="input-field">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input 
                                type="text" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email" 
                                required 
                                autoFocus 
                            />
                        </div>
                    </div>

                    <div className="input-field">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password" 
                                required 
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? (
                            <Loader2 className="spinner" size={20} />
                        ) : (
                            <>
                                Sign In <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="status-indicator">
                        <span className="dot"></span>
                        Secure Login
                    </div>
                </div>
            </div>
        </div>
    );
}
