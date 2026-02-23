import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [bump, setBump] = useState(false);

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

    // Cart bump animation when item added
    useEffect(() => {
        if (cartCount > prevCountRef.current) {
            setBump(true);
            setTimeout(() => setBump(false), 400);
        }
        prevCountRef.current = cartCount;
    }, [cartCount]);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container container">
                <div className="navbar-logo">
                    <a href="/" className="brand-font">WHT</a>
                </div>

                <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
                    <a href="/#latest-drop" onClick={() => setMenuOpen(false)}>Latest Drop</a>
                    <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
                </div>

                <div className="navbar-actions">
                    <button
                        className={`icon-btn cart-btn ${bump ? 'bump' : ''}`}
                        aria-label={`Cart (${cartCount} items)`}
                        onClick={() => setIsCartOpen(true)}
                    >
                        <ShoppingBag
                            size={20}
                            strokeWidth={1.5}
                            className="nav-icon"
                        />
                        {cartCount > 0 && (
                            <span className="cart-count-dot">{cartCount}</span>
                        )}
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
