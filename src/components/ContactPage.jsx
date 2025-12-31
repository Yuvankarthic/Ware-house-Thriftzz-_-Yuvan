import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, ArrowRight } from 'lucide-react';
import '../styles/ContactPage.css';

const ContactPage = () => {
    return (
        <div className="contact-page">
            <div className="container contact-container">

                {/* HERO SECTION */}
                <motion.section
                    className="contact-hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
                >
                    <h1 className="contact-title">Let’s Talk.</h1>
                    <p className="contact-subtext">Calls only. Real conversations. No bots.</p>
                </motion.section>

                {/* PRIMARY CONTACT */}
                <motion.section
                    className="contact-main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                >
                    <a href="tel:+917530039915" className="phone-number">
                        +91 75300 39915
                    </a>
                    <span className="availability-text">Available during working hours</span>
                </motion.section>

                {/* LOCATION */}
                <motion.section
                    className="contact-location"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                >
                    <p className="location-text">Bangalore, India</p>
                </motion.section>

                {/* SOCIAL */}
                <motion.section
                    className="contact-social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                >
                    <a
                        href="https://www.instagram.com/wearhousethriftxzz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <Instagram size={20} className="social-icon" />
                        <span>Follow us on Instagram</span>
                    </a>
                </motion.section>

            </div>
        </div>
    );
};

export default ContactPage;
