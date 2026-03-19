import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Loader2, Lock, Wifi, WifiOff } from 'lucide-react';
import BASE_URL from '../../config/api';
import '../styles/admin.css';

const API = `${BASE_URL}/api`;

export default function LoginPage({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const history = useHistory();

    // Check server status on mount and periodically
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const baseUrl = BASE_URL || 'https://ware-house-thriftzz-yuvan-production.up.railway.app';
                const healthUrl = `${baseUrl}/health`;
                
                console.log('🔍 [Health Check] Calling:', healthUrl);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    console.warn('⚠️ [Health Check] Timeout after 15 seconds');
                }, 15000);
                
                try {
                    const res = await fetch(healthUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        },
                        signal: controller.signal,
                        credentials: 'omit'
                    });
                    
                    clearTimeout(timeoutId);
                    console.log(`✅ [Health Check] Response Status: ${res.status}`);
                    console.log(`✅ [Health Check] Response OK: ${res.ok}`);
                    
                    if (res.ok && (res.status === 200 || res.status === 304)) {
                        setIsOnline(true);
                        console.log(`✅ [Health Check] ONLINE ✓ (Status: ${res.status})`);
                    } else {
                        setIsOnline(false);
                        console.warn(`⚠️ [Health Check] Server returned status: ${res.status}`);
                    }
                } catch (fetchErr) {
                    clearTimeout(timeoutId);
                    
                    if (fetchErr.name === 'AbortError') {
                        console.error('❌ [Health Check] Request timeout after 15 seconds');
                    } else {
                        console.error('⚠️ [Health Check] Fetch error:', {
                            name: fetchErr.name,
                            message: fetchErr.message,
                        });
                    }
                    setIsOnline(false);
                }
            } catch (err) {
                console.error('❌ [Health Check] Outer error:', {
                    message: err.message,
                    code: err.code,
                    name: err.name
                });
                setIsOnline(false);
            }
        };

        // Check immediately
        checkServerStatus();

        // Check every 15 seconds instead of 20 to be more responsive
        const interval = setInterval(checkServerStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const baseUrl = BASE_URL || 'https://ware-house-thriftzz-yuvan-production.up.railway.app';
            const loginUrl = `${baseUrl}/api/auth/quick-login`;
            
            console.log('🔐 Attempting login to:', loginUrl);
            
            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ password }),
            });
            
            console.log('📡 Login response status:', res.status);
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
            console.error('❌ Login error:', err);
            setError('Cannot connect to backend. Please try again.');
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
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter warehouse password" 
                                required 
                                autoFocus 
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
                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                        <span className={`status-light ${isOnline ? 'online' : 'offline'}`}></span>
                        {isOnline ? (
                            <>
                                <Wifi size={14} />
                                System Online
                            </>
                        ) : (
                            <>
                                <WifiOff size={14} />
                                System Offline
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
