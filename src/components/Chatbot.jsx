import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { default as X } from 'lucide-react/dist/esm/icons/x';
import { default as Send } from 'lucide-react/dist/esm/icons/send';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import BASE_URL from '../config/api';
import '../styles/Chatbot.css';

const BOT_NAME = 'Alien';

const UFOIcon = () => (
    <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="ufo-icon">
        <defs>
            <filter id="ufoGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <linearGradient id="tealBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ced1" />
                <stop offset="100%" stopColor="#008b8b" />
            </linearGradient>
            <linearGradient id="domeGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8F4F8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#B8D4E3" stopOpacity="0.6" />
            </linearGradient>
        </defs>
        
        <path d="M30 75 L50 95 L70 75" fill="url(#beamGradient)" opacity="0.6" className="ufo-beam"/>
        <defs>
            <linearGradient id="beamGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FFE066" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFE066" stopOpacity="0.1" />
            </linearGradient>
        </defs>
        
        <ellipse cx="50" cy="45" rx="18" ry="12" fill="#FFE066" opacity="0.15" filter="url(#ufoGlow)"/>
        <ellipse cx="50" cy="42" rx="16" ry="14" fill="url(#domeGlass)" stroke="#D4A5B9" strokeWidth="1"/>
        
        <circle cx="44" cy="40" r="2.5" fill="#2D3436"/>
        <circle cx="56" cy="40" r="2.5" fill="#2D3436"/>
        
        <ellipse cx="50" cy="55" rx="32" ry="12" fill="url(#tealBody)" filter="url(#ufoGlow)"/>
        <ellipse cx="50" cy="52" rx="32" ry="12" fill="url(#tealBody)"/>
        
        <ellipse cx="50" cy="48" rx="16" ry="6" fill="#FF8FB3"/>
        
        <circle cx="20" cy="55" r="3" fill="#FFE066" filter="url(#ufoGlow)" className="ufo-light"/>
        <circle cx="35" cy="63" r="2.5" fill="#FFE066" filter="url(#ufoGlow)" className="ufo-light"/>
        <circle cx="50" cy="67" r="3" fill="#FFE066" filter="url(#ufoGlow)" className="ufo-light"/>
        <circle cx="65" cy="63" r="2.5" fill="#FFE066" filter="url(#ufoGlow)" className="ufo-light"/>
        <circle cx="80" cy="55" r="3" fill="#FFE066" filter="url(#ufoGlow)" className="ufo-light"/>
        
        <ellipse cx="40" cy="48" rx="10" ry="4" fill="white" opacity="0.3"/>
    </svg>
);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi, I am Alien, your Wearhouse assistant! 🛸\n\nAsk me anything about:\n• Products & prices\n• Track your order\n• Shipping & returns", sender: 'bot', type: 'text' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [pendingOrderLookup, setPendingOrderLookup] = useState(null);
    const messagesEndRef = useRef(null);
    const { addToCart } = useCart();

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const sendMessage = async (userMessage, chatHistory) => {
        try {
            const response = await fetch(`${BASE_URL}/api/chatbot`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory || []
                })
            });
            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error("Chatbot API Error:", error);
            throw error;
        }
    };

    const trackOrder = async (orderId, phone) => {
        try {
            const response = await fetch(`${BASE_URL}/api/orders/track-order?order_id=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone || '')}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (data.success) {
                return { 
                    success: true, 
                    order: {
                        id: data.order_id,
                        shipping_status: data.order_status,
                        payment_status: data.status,
                        total: 0,
                        created_at: new Date().toISOString()
                    }
                };
            }
            return { success: false, error: data.error || 'Order not found' };
        } catch (error) {
            console.error("Order tracking error:", error);
            return { success: false, error: 'Could not track order' };
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        
        if (pendingOrderLookup) {
            const input = inputValue.trim();
            if (!input) return;
            
            const userMsg = { id: Date.now(), text: input, sender: 'user', type: 'text' };
            setMessages(prev => [...prev, userMsg]);
            setInputValue('');
            setIsTyping(true);

            const phoneMatch = input.match(/^(\d{10,})$/);
            const orderId = pendingOrderLookup.orderId || input;

            const result = await trackOrder(orderId, phoneMatch ? phoneMatch[1] : null);
            
            let replyText = '';
            if (result.success && result.order) {
                const o = result.order;
                replyText = `📦 *Order Found!*\n\n*Order ID:* ${o.id}\n*Status:* ${o.shipping_status || o.payment_status}\n*Total:* ₹${o.total}\n*Date:* ${new Date(o.created_at).toLocaleDateString()}`;
            } else {
                replyText = "😕 Couldn't find an order with those details. Please check your Order ID or registered phone number.";
            }

            const botMsg = { 
                id: Date.now() + 1, 
                text: replyText, 
                sender: 'bot',
                type: 'text'
            };
            setMessages(prev => [...prev, botMsg]);
            setPendingOrderLookup(null);
            setIsTyping(false);
            return;
        }

        if (!inputValue.trim()) return;

        const currentInput = inputValue;
        const userMsg = { id: Date.now(), text: currentInput, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        if (/track.*order|order.*status|where.*order|my order/i.test(currentInput)) {
            setPendingOrderLookup({ step: 'orderId' });
            const botMsg = { 
                id: Date.now() + 1, 
                text: "Sure! Let's track your order 📦\n\nPlease enter your Order ID (e.g., ORD-123456) or your registered phone number.", 
                sender: 'bot',
                type: 'text'
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
            return;
        }

        try {
            const history = messages.slice(-10).map(msg => ({ sender: msg.sender, text: msg.text }));
            const replyText = await sendMessage(currentInput, history);
            
            const botMsg = { 
                id: Date.now() + 1, 
                text: replyText || "Oops, my fashion brain lagged. Try again in a sec 😅", 
                sender: 'bot',
                type: 'text'
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const fallbackMsg = {
                id: Date.now() + 1,
                text: "Oops, my fashion brain lagged. Try again in a sec 😅",
                sender: 'bot',
                type: 'text'
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderProductMessage = (msg) => {
        return (
            <div className="chat-message bot message-format-products">
                <div className="message-text">{msg.text}</div>
                <div className="chat-product-carousel">
                    {msg.products.slice(0, 5).map(product => (
                        <div key={product.id} className="chat-product-card">
                            <img src={product.images[0]} alt={product.name} />
                            <div className="chat-product-info">
                                <h6>{product.name}</h6>
                                <p>₹{product.price}</p>
                                <button
                                    className="chat-add-btn"
                                    onClick={(e) => addToCart(product, e)}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    ))}
                    {msg.products.length > 5 && (
                        <div className="chat-product-more">
                            +{msg.products.length - 5} more. Head to the Shop to see all.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <motion.button
                className="chatbot-toggle"
                onClick={toggleChat}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle Chat"
            >
                {isOpen ? (
                    <X size={24} color="#fff" />
                ) : (
                    <>
                        <span className="ufo-label">Alien</span>
                        <span className="ufo-wrapper"><UFOIcon /></span>
                    </>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-window"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="chatbot-header">
                            <div>
                                <h3>{BOT_NAME}</h3>
                                <p>We're here to help!</p>
                            </div>
                            <button className="chat-close" onClick={toggleChat}><X size={18} /></button>
                        </div>

                        <div className="chatbot-messages">
                            {messages.map((msg) => (
                                <React.Fragment key={msg.id}>
                                    {msg.type === 'products' ? (
                                        renderProductMessage(msg)
                                    ) : (
                                        <div className={`chat-message ${msg.sender}`}>
                                            <div className="message-content">{msg.text}</div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                            {isTyping && (
                                <div className="chat-message bot typing-indicator">
                                    <div className="message-content">Thinking<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chatbot-input" onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder={pendingOrderLookup ? "Enter Order ID or phone number" : "Type a message..."}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isTyping}
                            />
                            <button type="submit" disabled={!inputValue.trim() || isTyping}>
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence >
        </>
    );
};

export default Chatbot;