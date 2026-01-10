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
                <h1>ORDER CONFIRMED. 🖤</h1>
                <h2>Welcome to the WHT club. 🏁🔥</h2>
                <p>We’ll reach out shortly with the details.</p>
                <button className="btn-back-store" onClick={onClose}>
                    BACK TO STORE
                </button>
            </motion.div>
        </motion.div>
    );
};

export default OrderSuccess;
