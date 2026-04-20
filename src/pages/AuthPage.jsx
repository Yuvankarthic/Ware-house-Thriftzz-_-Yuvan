import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import '../styles/AuthPage.css';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Sign Up
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // Log in flow
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Logged in successfully! 🎉');
        // Usually, you would redirect the user here using react-router-dom
      } else {
        // Sign up flow
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Registration successful! Please check your email to verify your account.');
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
        
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}

        <button
          className="toggle-auth-btn"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin 
            ? "Don't have an account? Sign Up" 
            : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  );
}
