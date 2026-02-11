import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="container footer-content">
                <div className="footer-brand">
                    <span>WHT © {currentYear}</span>
                </div>
                <div className="footer-contact-group">
                    <span className="contact-label">Contact Us</span>
                    <a href="tel:+917530039915" className="footer-phone">+91 75300 39915</a>
                </div>
                <div className="footer-links">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="#legal">Legal</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
