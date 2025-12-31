import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/CartDrawer.css';

const CartDrawer = () => {
    const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        className="cart-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                    />
                    <motion.div
                        className="cart-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', daamping: 25, stiffness: 200 }}
                    >
                        <div className="cart-header">
                            <h3>My Cart</h3>
                            <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="cart-items">
                            {cartItems.length === 0 ? (
                                <div className="empty-cart">
                                    <p>Your cart is empty.</p>
                                    <button className="btn-shop" onClick={() => setIsCartOpen(false)}>Continue Shopping</button>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-image">
                                            {/* Using flat image for cart */}
                                            <span className="cart-placeholder">{item.name[0]}</span>
                                        </div>
                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p className="cart-item-meta">{item.size} / {item.condition}</p>
                                            <div className="cart-item-price">₹{item.price}</div>

                                            <div className="cart-controls">
                                                <div className="qty-controls">
                                                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                                                </div>
                                                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <p className="shipping-note">Shipping calculated at checkout</p>
                                <button className="btn-primary checkout-btn">
                                    Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
