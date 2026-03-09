import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { default as MessageCircle } from 'lucide-react/dist/esm/icons/message-circle';
import { default as X } from 'lucide-react/dist/esm/icons/x';
import { default as Send } from 'lucide-react/dist/esm/icons/send';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import '../styles/Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your WHT Assistant. How can I help you today? Try asking 'Show me black jackets' or 'What is your return policy?'", sender: 'bot', type: 'text' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const { addToCart } = useCart();

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const processInput = (text) => {
        const lowerText = text.toLowerCase();
        let responseText = "I'm sorry, I don't understand that. You can ask me to show you products (e.g., 'black jackets', 'size M') or ask about our policies.";
        let responseProducts = null;

        // 1. Greetings
        if (lowerText.match(/^(hi|hello|hey|help|start)/)) {
            responseText = "Hello! Looking for something specific? I can help you find products by color, type, or size.";
        }
        // 2. FAQ - Policies
        else if (lowerText.includes('return') || lowerText.includes('refund')) {
            responseText = "We accept returns within 14 days of delivery. Items must be unworn with original tags attached.";
        }
        // 3. FAQ - Shipping
        else if (lowerText.includes('shipping') || lowerText.includes('delivery')) {
            responseText = "Standard shipping usually takes 3-5 business days. We offer free shipping on orders over ₹2000.";
        }
        // 4. Product Search Rules
        else {
            // Check for colors
            const colors = ['black', 'blue', 'brown', 'multicolor', 'pattern'];
            const foundColors = colors.filter(c => lowerText.includes(c));

            // Check for keywords
            const isJacket = lowerText.includes('jacket') || lowerText.includes('fleece') || lowerText.includes('layer') || lowerText.includes('trench');
            const isVest = lowerText.includes('vest');

            // Check for size
            const sizeMatch = lowerText.match(/\bsize\s*([xs|s|m|l|xl]+)\b/);
            const requestedSize = sizeMatch ? sizeMatch[1].toUpperCase() : null;

            // Simple search logic if there are any identifiers
            if (foundColors.length > 0 || isJacket || isVest || requestedSize) {
                let filtered = products;

                if (foundColors.length > 0) {
                    // Since we don't have explicit color data, we search the name
                    filtered = filtered.filter(p => foundColors.some(c => p.name.toLowerCase().includes(c)));
                }

                if (isJacket) {
                    filtered = filtered.filter(p => p.name.toLowerCase().includes('jacket') || p.name.toLowerCase().includes('layer') || p.name.toLowerCase().includes('fleece') || p.name.toLowerCase().includes('trench'));
                } else if (isVest) {
                    filtered = filtered.filter(p => p.name.toLowerCase().includes('vest'));
                }

                if (requestedSize) {
                    filtered = filtered.filter(p => p.size.toUpperCase().includes(requestedSize));
                }

                if (filtered.length > 0) {
                    responseText = `I found ${filtered.length} item(s) that match your request:`;
                    responseProducts = filtered;
                } else {
                    responseText = "I couldn't find any items matching those exact details right now, but feel free to browse our full collection!";
                }
            }
        }

        return { text: responseText, products: responseProducts, type: responseProducts ? 'products' : 'text' };
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { id: Date.now(), text: inputValue, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');

        // Simulate thinking delay
        setTimeout(() => {
            const botResponse = processInput(userMsg.text);
            const botMsg = { id: Date.now() + 1, ...botResponse, sender: 'bot' };
            setMessages(prev => [...prev, botMsg]);
        }, 600);
    };

    // Render mini product card in chat
    const renderProductMessage = (msg) => {
        return (
            <div className="chat-message bot message-format-products">
                <div className="message-text">{msg.text}</div>
                <div className="chat-product-carousel">
                    {msg.products.slice(0, 5).map(product => ( // limit to 5 to avoid enormous chat bubbles
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
                {isOpen ? <X size={24} color="#fff" /> : <MessageCircle size={24} color="#fff" />}
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
                                <h3>WHT Assistant</h3>
                                <p>Always here to help</p>
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
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chatbot-input" onSubmit={handleSend}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <button type="submit" disabled={!inputValue.trim()}>
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
