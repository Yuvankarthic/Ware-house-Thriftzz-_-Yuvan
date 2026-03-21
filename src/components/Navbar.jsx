import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Heart, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [bump, setBump] = useState(false);

    const { cartCount, setIsCartOpen } = useCart();
    const { wishlistItems, setIsWishlistOpen } = useWishlist();
    const prevCountRef = useRef(cartCount);
    const wishlistCount = wishlistItems.length;

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
                    <Link to="/shop" onClick={closeMenu}>Shop</Link>
                    <Link to="/shop#latest-drop" onClick={closeMenu}>New Arrivals</Link>
                    <Link to="/about" onClick={closeMenu}>Our Story</Link>

                    {/* Mobile-only extras */}
                    <div className="nav-mobile-extras">
                        <p className="nav-city-tag">📍 Bengaluru, India</p>
                        <Link to="/admin" className="nav-mobile-admin-btn" onClick={closeMenu}>
                            <ShieldCheck size={16} strokeWidth={1.5} />
                            Admin Access
                        </Link>
                        <button
                            className="nav-mobile-cart-btn"
                            onClick={() => { setIsCartOpen(true); closeMenu(); }}
                        >
                            <ShoppingBag size={16} strokeWidth={1.5} />
                            View Cart {cartCount > 0 && `(${cartCount})`}
                        </button>
                        <button
                            className="nav-mobile-wishlist-btn"
                            onClick={() => { setIsWishlistOpen(true); closeMenu(); }}
                        >
                            <Heart size={16} strokeWidth={1.5} />
                            View Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="navbar-actions">
                    <Link
                        to="/admin"
                        className="icon-btn admin-access-btn"
                        aria-label="Admin Access"
                        title="Admin Login"
                    >
                        <ShieldCheck size={18} strokeWidth={1.5} className="nav-icon" />
                    </Link>

                    <button
                        className="icon-btn wishlist-btn"
                        aria-label={`Wishlist (${wishlistCount} items)`}
                        onClick={() => setIsWishlistOpen(true)}
                    >
                        <Heart size={20} strokeWidth={1.5} className="nav-icon" />
                        {wishlistCount > 0 && (
                            <span className="cart-count-dot wishlist-count-dot">{wishlistCount}</span>
                        )}
                    </button>
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
