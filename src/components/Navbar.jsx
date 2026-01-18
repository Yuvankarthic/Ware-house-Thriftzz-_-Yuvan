import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, HeartCrack, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [animState, setAnimState] = useState('idle'); // 'idle', 'pulse', 'break'

    const { cartCount, setIsCartOpen } = useCart();
    const prevCountRef = useRef(cartCount);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cart Animation Logic
    useEffect(() => {
        if (cartCount > prevCountRef.current) {
            // Added item -> Pulse
            setAnimState('pulse');
            setTimeout(() => setAnimState('idle'), 400);
        } else if (cartCount < prevCountRef.current) {
            // Removed item -> Break
            setAnimState('break');
            setTimeout(() => setAnimState('idle'), 500);
        }
        prevCountRef.current = cartCount;
    }, [cartCount]);

    const isBreaking = animState === 'break';
    const isFilled = cartCount > 0 && !isBreaking;

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container container">
                <div className="navbar-logo">
                    <a href="/" style={{ fontFamily: "'Pixelify Sans', sans-serif", fontWeight: 400 }}>WHT</a>
                </div>

                <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
                    <a href="/#latest-drop" onClick={() => setMenuOpen(false)}>Latest Drop</a>
                    <a href="/#about" onClick={() => setMenuOpen(false)}>About</a>
                    <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
                </div>

                <div className="navbar-actions">
                    <button
                        className={`icon-btn cart-btn ${animState}`}
                        aria-label="Cart"
                        onClick={() => setIsCartOpen(true)}
                    >
                        {isBreaking ? (
                            <HeartCrack
                                size={20}
                                strokeWidth={1.5}
                                className="nav-icon breaking"
                                color="currentColor" // Explicit color inheritance
                            />
                        ) : (
                            <Heart
                                size={20}
                                strokeWidth={1.5}
                                className={`nav-icon ${isFilled ? 'filled' : ''}`}
                                fill={isFilled ? "currentColor" : "none"}
                                color="currentColor"
                            />
                        )}

                        {/* Dot indicator enabled as per request "Optional: show a small minimal count" */}
                        {cartCount > 0 && <span className="cart-count-dot">{cartCount}</span>}
                    </button>

                    <button className="icon-btn mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
