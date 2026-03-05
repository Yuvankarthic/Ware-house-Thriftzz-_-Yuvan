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

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (cartCount > prevCountRef.current) {
            setBump(true);
            setTimeout(() => setBump(false), 400);
        }
        prevCountRef.current = cartCount;
    }, [cartCount]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container container">

                {/* Logo */}
                <div className="navbar-logo">
                    <a href="/" className="brand-font">WHT</a>
                </div>

                {/* Desktop + Mobile nav links */}
                <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
                    <a href="/#latest-drop" onClick={closeMenu}>Shop</a>
                    <a href="/#latest-drop" onClick={closeMenu}>New Arrivals</a>
                    <Link to="/about" onClick={closeMenu}>Our Story</Link>

                    {/* Mobile-only extras */}
                    <div className="nav-mobile-extras">
                        <p className="nav-city-tag">📍 Bengaluru, India</p>
                        <button
                            className="nav-mobile-cart-btn"
                            onClick={() => { setIsCartOpen(true); closeMenu(); }}
                        >
                            <ShoppingBag size={16} strokeWidth={1.5} />
                            View Cart {cartCount > 0 && `(${cartCount})`}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="navbar-actions">
                    <button
                        className={`icon-btn cart-btn ${bump ? 'bump' : ''}`}
                        aria-label={`Cart (${cartCount} items)`}
                        onClick={() => setIsCartOpen(true)}
                    >
                        <ShoppingBag size={20} strokeWidth={1.5} className="nav-icon" />
                        {cartCount > 0 && (
                            <span className="cart-count-dot">{cartCount}</span>
                        )}
                    </button>

                    <button
                        className="icon-btn mobile-toggle"
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        onClick={() => setMenuOpen(prev => !prev)}
                    >
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
