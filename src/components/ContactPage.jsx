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

                {/* REMOVED HERO PHONE NUMBER AS REQUESTED */}

                {/* CONTACT GROUPS CONTAINER */}
                <motion.div
                    className="contact-groups-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                >
                    {/* GENERAL ENQUIRY */}
                    <div className="contact-group">
                        <span className="group-label">General Enquiry</span>
                        <a href="tel:+917530039915" className="group-phone">
                            +91 75300 39915
                        </a>
                        <span className="group-subtext">Available during working hours</span>
                    </div>

                    {/* SALES TEAM */}
                    <div className="contact-group">
                        <span className="group-label">Sales Team</span>
                        <div className="group-phones-list">
                            <a href="tel:+91996238065" className="group-phone">
                                +91 99623 8065
                            </a>
                            <a href="tel:+916379849026" className="group-phone">
                                +91 63798 49026
                            </a>
                        </div>
                        <span className="group-subtext">Orders, drops & availability</span>
                    </div>
                </motion.div>

                {/* LOCATION */}
                <motion.section
                    className="contact-location"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                >
                    <p className="location-text">Bangalore, India</p>
                </motion.section>

                {/* SOCIAL - Removed from layout request, implied to keep minimal. Keeping it at bottom or hiding if needed? 
                   User said "Group details in TWO clearly grouped sections... Place Bangalore at bottom".
                   Social isn't explicitly mentioned in the "Keep..." list but likely shouldn't break page.
                   I'll keep it as a muted footer element if it exists, or just ensure it doesn't clutter.
                   Actually, user said "Structure the page as follows... Place Bangalore at bottom".
                   I will keep Social below Location if it was there, but simplify spacing.
                */}
                <motion.section
                    className="contact-social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                >
                    <a
                        href="https://www.instagram.com/wearhousethriftxzz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        <Instagram size={18} className="social-icon" />
                        <span>Follow us on Instagram</span>
                    </a>
                </motion.section>

            </div>
        </div>
    );
};

export default ContactPage;
