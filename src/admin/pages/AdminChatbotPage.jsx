import React, { useState, useRef, useEffect } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

export default function AdminChatbot({ token }) {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'Hey! I\'m your admin assistant. Ask me anything:\n\n• "how many orders today"\n• "show my recent orders"\n• "change price of hoodie to 799"\n• "apply discount on slow items"\n• Or just ask questions!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const messagesEndRef = useRef(null);
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        
        const userMessage = input.trim();
        setInput('');
        
        const userMsg = { id: Date.now(), sender: 'user', text: userMessage };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const history = messages.map(m => ({ sender: m.sender, text: m.text }));
            
            const res = await fetch(`${API}/ai/admin-chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message: userMessage, history })
            });
            const data = await res.json();

            if (data.type === 'question') {
                const aiMsg = { 
                    id: Date.now() + 1, 
                    sender: 'ai', 
                    text: data.message,
                    type: 'question'
                };
                setMessages(prev => [...prev, aiMsg]);
            } else if (data.type === 'action' && data.intent && data.intent !== 'UNKNOWN') {
                const aiMsg = { 
                    id: Date.now() + 1, 
                    sender: 'ai', 
                    text: data.message,
                    intent: data.intent,
                    data: data.data,
                    needsApproval: true,
                    type: 'action'
                };
                setMessages(prev => [...prev, aiMsg]);
                setPendingAction({ intent: data.intent, data: data.data, messageId: aiMsg.id });
            } else {
                const aiMsg = { 
                    id: Date.now() + 1, 
                    sender: 'ai', 
                    text: data.message || "I didn't understand that. Try asking about orders, products, or prices!" 
                };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch (err) {
            const aiMsg = { 
                id: Date.now() + 1, 
                sender: 'ai', 
                text: 'Something went wrong. Try again.' 
            };
            setMessages(prev => [...prev, aiMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!pendingAction) return;
        
        setLoading(true);
        
        const actionMsgId = pendingAction.messageId;
        setMessages(prev => prev.map(m => 
            m.id === actionMsgId ? { ...m, text: 'Executing...', needsApproval: false } : m
        ));

        try {
            const res = await fetch(`${API}/ai/action`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ intent: pendingAction.intent, data: pendingAction.data })
            });
            const data = await res.json();

            setMessages(prev => prev.map(m => 
                m.id === actionMsgId ? { ...m, text: data.message || 'Action completed!', needsApproval: false } : m
            ));
        } catch (err) {
            setMessages(prev => prev.map(m => 
                m.id === actionMsgId ? { ...m, text: 'Failed to execute action', needsApproval: false } : m
            ));
        } finally {
            setLoading(false);
            setPendingAction(null);
        }
    };

    const handleCancel = () => {
        if (!pendingAction) return;
        
        const actionMsgId = pendingAction.messageId;
        setMessages(prev => prev.map(m => 
            m.id === actionMsgId ? { ...m, text: 'Action cancelled', needsApproval: false } : m
        ));
        setPendingAction(null);
    };

    const cardStyle = {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid #8b5cf6',
        borderRadius: 12,
        padding: 20,
        height: 'calc(100vh - 180px)',
        display: 'flex',
        flexDirection: 'column',
    };

    const messageStyle = (sender) => ({
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: 12,
        marginBottom: 12,
        background: sender === 'user' ? '#8b5cf6' : '#1f2937',
        color: '#fff',
        alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
    });

    const inputContainerStyle = {
        display: 'flex',
        gap: 12,
        marginTop: 'auto',
        paddingTop: 16,
        borderTop: '1px solid #374151',
    };

    const inputStyle = {
        flex: 1,
        padding: '12px 16px',
        borderRadius: 8,
        border: '1px solid #374151',
        background: '#1f2937',
        color: '#fff',
        fontSize: '0.95rem',
        outline: 'none',
    };

    const buttonStyle = {
        padding: '12px 24px',
        borderRadius: 8,
        border: 'none',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    };

    return (
        <div>
            <div className="admin-page-header">
                <h1>🧠 Admin Chatbot</h1>
                <p style={{ color: '#9ca3af', marginTop: 4 }}>AI-powered admin control</p>
            </div>

            <div style={cardStyle}>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={messageStyle(msg.sender)}>
                            <div style={{ marginBottom: msg.needsApproval ? 12 : 0, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            
                            {msg.needsApproval && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={loading}
                                        style={{ 
                                            ...buttonStyle, 
                                            background: '#10b981', 
                                            color: '#fff',
                                            opacity: loading ? 0.5 : 1,
                                        }}
                                    >
                                        ✓ Confirm
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        style={{ 
                                            ...buttonStyle, 
                                            background: '#ef4444', 
                                            color: '#fff',
                                            opacity: loading ? 0.5 : 1,
                                        }}
                                    >
                                        ✕ Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div style={inputContainerStyle}>
                    <input
                        type="text"
                        style={inputStyle}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask: how many orders, show orders, change price of product 5 to 500..."
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        style={{ 
                            ...buttonStyle, 
                            background: loading ? '#6b7280' : '#8b5cf6', 
                            color: '#fff',
                            opacity: loading || !input.trim() ? 0.5 : 1,
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}