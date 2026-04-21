import React, { useState, useEffect } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

export default function ReelsIdeasPage({ token }) {
    const [ideas, setIdeas] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const generateIdeas = async () => {
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch(`${API}/ai/reels-ideas`, {
                method: 'POST',
                headers
            });
            const data = await res.json();
            
            if (data.success) {
                setIdeas(data.ideas);
            } else {
                setError(data.error || 'Failed to generate ideas');
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

    useEffect(() => {
        generateIdeas();
    }, []);

    const cardStyle = {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid #8b5cf6',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    };

    const sectionStyle = {
        background: '#1f2937',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    };

    const sectionTitleStyle = {
        color: '#8b5cf6',
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

    const topicStyle = {
        display: 'inline-block',
        background: '#8b5cf620',
        color: '#a78bfa',
        padding: '6px 12px',
        borderRadius: 20,
        margin: '4px',
        fontSize: '0.85rem',
    };

    const ideaCardStyle = {
        background: '#0f172a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        border: '1px solid #374151',
    };

    return (
        <div>
            <div className="admin-page-header">
                <h1>🎬 Reels Script Ideas</h1>
                <p style={{ color: '#9ca3af', marginTop: 4 }}>AI-powered content ideas for Instagram Reels</p>
            </div>

            <div style={cardStyle}>
                <button
                    onClick={generateIdeas}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: loading ? '#6b7280' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Analyzing Products...' : '🔄 Refresh Ideas'}
                </button>

                {error && (
                    <p style={{ color: '#ef4444', marginTop: 12, fontSize: '0.9rem' }}>{error}</p>
                )}
            </div>

            {ideas && (
                <>
                    {ideas.trendingTopics && ideas.trendingTopics.length > 0 && (
                        <div style={cardStyle}>
                            <h3 style={{ color: '#fff', marginBottom: 12 }}>🔥 Trending Topics</h3>
                            <div>
                                {ideas.trendingTopics.map((topic, i) => (
                                    <span key={i} style={topicStyle}>{topic}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {ideas.reelIdeas && ideas.reelIdeas.length > 0 && (
                        <div style={cardStyle}>
                            <h3 style={{ color: '#fff', marginBottom: 16 }}>🎬 Reel Ideas</h3>
                            {ideas.reelIdeas.map((idea, i) => (
                                <div key={i} style={ideaCardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h4 style={{ color: '#fff', margin: 0 }}>{idea.title}</h4>
                                        <button
                                            onClick={() => copyToClipboard(JSON.stringify(idea, null, 2))}
                                            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                    
                                    <div style={{ marginBottom: 8 }}>
                                        <span style={sectionTitleStyle}>Concept</span>
                                        <p style={{ ...contentStyle, margin: '4px 0' }}>{idea.concept}</p>
                                    </div>
                                    
                                    <div style={{ marginBottom: 8 }}>
                                        <span style={sectionTitleStyle}>Hook (First 3 sec)</span>
                                        <p style={{ ...contentStyle, margin: '4px 0', color: '#fbbf24' }}>{idea.hook}</p>
                                    </div>
                                    
                                    <div style={{ marginBottom: 8 }}>
                                        <span style={sectionTitleStyle}>Script</span>
                                        <p style={{ ...contentStyle, margin: '4px 0' }}>{idea.script}</p>
                                    </div>
                                    
                                    {idea.hashtags && (
                                        <div style={{ marginBottom: 8 }}>
                                            <span style={sectionTitleStyle}>Hashtags</span>
                                            <p style={{ ...contentStyle, margin: '4px 0', color: '#60a5fa' }}>{idea.hashtags.join(' ')}</p>
                                        </div>
                                    )}
                                    
                                    {idea.audio && (
                                        <div>
                                            <span style={sectionTitleStyle}>Suggested Audio</span>
                                            <p style={{ ...contentStyle, margin: '4px 0', color: '#f472b6' }}>🎵 {idea.audio}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {ideas.bestPractices && ideas.bestPractices.length > 0 && (
                        <div style={cardStyle}>
                            <h3 style={{ color: '#fff', marginBottom: 12 }}>💡 Best Practices</h3>
                            <ul style={{ color: '#e5e7eb', paddingLeft: 20 }}>
                                {ideas.bestPractices.map((tip, i) => (
                                    <li key={i} style={{ marginBottom: 8 }}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {ideas.postingSchedule && (
                        <div style={{ ...cardStyle, borderColor: '#10b981' }}>
                            <h3 style={{ color: '#fff', marginBottom: 12 }}>🕐 Best Posting Times</h3>
                            <p style={contentStyle}>{ideas.postingSchedule}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}