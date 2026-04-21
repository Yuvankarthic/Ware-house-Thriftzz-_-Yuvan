import React, { useState } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

export default function InstagramScriptGenerator({ token }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'hoodie',
        style: ''
    });
    const [script, setScript] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setScript(null);

        try {
            const res = await fetch(`${API}/ai/instagram-script`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: formData.name,
                    price: parseInt(formData.price),
                    category: formData.category,
                    style: formData.style
                })
            });
            const data = await res.json();
            
            if (data.success) {
                setScript(data.script);
            } else {
                setError(data.error || 'Failed to generate script');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const cardStyle = {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid #ec4899',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid #374151',
        background: '#1f2937',
        color: '#fff',
        fontSize: '0.95rem',
        marginBottom: 12,
    };

    const labelStyle = {
        display: 'block',
        color: '#9ca3af',
        fontSize: '0.85rem',
        marginBottom: 6,
    };

    const sectionStyle = {
        background: '#1f2937',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    };

    const sectionTitleStyle = {
        color: '#ec4899',
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        marginBottom: 8,
    };

    const contentStyle = {
        color: '#e5e7eb',
        fontSize: '0.95rem',
        lineHeight: 1.5,
    };

    return (
        <div>
            <div className="admin-page-header">
                <h1>📸 Instagram Script Generator</h1>
            </div>

            <div style={cardStyle}>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Product Name *</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Vintage Oversized Hoodie"
                                required
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Price (₹) *</label>
                            <input
                                type="number"
                                style={inputStyle}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="999"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>Category *</label>
                            <select
                                style={inputStyle}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="hoodie">Hoodie</option>
                                <option value="jacket">Jacket</option>
                                <option value="shirt">Shirt</option>
                                <option value="tshirt">T-Shirt</option>
                                <option value="jeans">Jeans</option>
                                <option value="pant">Pant</option>
                                <option value="sweater">Sweater</option>
                                <option value="joggers">Joggers</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Style (optional)</label>
                            <input
                                type="text"
                                style={inputStyle}
                                value={formData.style}
                                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                placeholder="e.g., oversized streetwear"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: loading ? '#6b7280' : 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                            border: 'none',
                            borderRadius: 8,
                            color: '#fff',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: 8,
                        }}
                    >
                        {loading ? 'Generating...' : '✨ Generate Script'}
                    </button>

                    {error && (
                        <p style={{ color: '#ef4444', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>
                    )}
                </form>
            </div>

            {script && (
                <div style={{ ...cardStyle, borderColor: '#10b981' }}>
                    <h3 style={{ color: '#fff', marginBottom: 16 }}>Generated Script</h3>
                    
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={sectionTitleStyle}>Hook</span>
                            <button
                                onClick={() => copyToClipboard(script.hook)}
                                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                📋 Copy
                            </button>
                        </div>
                        <p style={contentStyle}>{script.hook}</p>
                    </div>

                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={sectionTitleStyle}>Caption</span>
                            <button
                                onClick={() => copyToClipboard(script.caption)}
                                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                📋 Copy
                            </button>
                        </div>
                        <p style={contentStyle}>{script.caption}</p>
                    </div>

                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={sectionTitleStyle}>Story Idea</span>
                            <button
                                onClick={() => copyToClipboard(script.story)}
                                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                📋 Copy
                            </button>
                        </div>
                        <p style={contentStyle}>{script.story}</p>
                    </div>

                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={sectionTitleStyle}>CTA</span>
                            <button
                                onClick={() => copyToClipboard(script.cta)}
                                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                📋 Copy
                            </button>
                        </div>
                        <p style={contentStyle}>{script.cta}</p>
                    </div>
                </div>
            )}
        </div>
    );
}