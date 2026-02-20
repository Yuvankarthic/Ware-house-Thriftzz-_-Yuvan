import React from 'react';
import { motion } from 'framer-motion';
import '../styles/OrderSuccess.css';

const OrderSuccess = ({ onClose }) => {
    return (
        <motion.div
            className="order-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="order-success-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
                <h1 className="brand-font">ORDER CONFIRMED.</h1>
                <h2>Welcome to the WHT club. 🏁</h2>
                <p>We’ve sent your official invoice to your email.</p>
                <p className="order-success-subtext">Our team will reach out shortly with shipping details.</p>
                <button className="btn-primary" onClick={onClose}>
                    BACK TO STORE
                </button>
            </motion.div>
        </motion.div>
    );
};

export default OrderSuccess;
