import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { cartCount, setIsCartOpen } = useCart();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container container">
                <div className="navbar-logo">
                    <a href="/">WHT</a>
                </div>

                <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
                    <a href="#latest-drop" onClick={() => setMenuOpen(false)}>Latest Drop</a>
                    <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
                    <a href="#info" onClick={() => setMenuOpen(false)}>Info</a>
                </div>

                <div className="navbar-actions">
                    <button className="icon-btn" aria-label="Cart" onClick={() => setIsCartOpen(true)}>
                        <ShoppingBag size={20} strokeWidth={1.5} />
                        <span className="cart-count">{cartCount}</span>
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
