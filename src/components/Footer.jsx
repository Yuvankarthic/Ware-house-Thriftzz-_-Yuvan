import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-inner container">
                {/* Brand Column */}
                <div className="footer-col footer-col--brand">
                    <span className="footer-brand brand-font">WHT</span>
                    <p className="footer-tagline">Premium vintage.<br />No hype tax.</p>
                </div>

                {/* Links Column */}
                <div className="footer-col">
                    <h4 className="footer-col-heading">Explore</h4>
                    <nav className="footer-nav">
                        <a href="/#latest-drop">Latest Drop</a>
                        <Link to="/track-order">Track Order</Link>
                        <Link to="/about">About WHT</Link>
                    </nav>
                </div>

                {/* Contact Column */}
                <div className="footer-col">
                    <h4 className="footer-col-heading">Contact</h4>
                    <div className="footer-contact-list">
                        <div className="footer-contact-item">
                            <span className="footer-contact-label">Instagram</span>
                            <a href="https://instagram.com/wht" target="_blank" rel="noopener noreferrer">@wht</a>
                        </div>
                        <div className="footer-contact-item">
                            <span className="footer-contact-label">Phone</span>
                            <a href="tel:+917530039915">+91 75300 39915</a>
                        </div>
                        <div className="footer-contact-item">
                            <span className="footer-contact-label">Payments</span>
                            <span className="footer-contact-value">payments.wht@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom container">
                <span>© {currentYear} WHT. All rights reserved.</span>
                <a href="#legal">Legal</a>
            </div>
        </footer>
    );
};

export default Footer;
