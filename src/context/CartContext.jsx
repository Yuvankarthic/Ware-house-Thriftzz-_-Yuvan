import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [flyingItems, setFlyingItems] = useState([]);

    const addToCart = (product, event = null) => {
        // 1. Add item to cart state implicitly (don't open drawer yet)
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, {
                ...product,
                image: product.images ? product.images[0] : null,
                quantity: 1
            }];
        });

        // 2. Handle Animation Logic
        if (event) {
            // Get coordinates of the clicked button
            const rect = event.currentTarget.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;

            const newItem = {
                id: Date.now() + Math.random(), // Unique ID for key
                startX,
                startY
            };

            setFlyingItems(prev => [...prev, newItem]);

            // Clean up the flying item and open drawer after animation finishes
            setTimeout(() => {
                setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
                setIsCartOpen(true);
            }, 800); // Wait 800ms for animation
        } else {
            // No event provided (fallback), open drawer immediately
            setIsCartOpen(true);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const clearCart = () => {
        setCartItems([]);
    };

    // Calculate the destination coordinates for the animation (the cart icon in nav)
    const [cartCoords, setCartCoords] = useState({ x: window.innerWidth - 50, y: 30 }); // Default fallback

    useEffect(() => {
        const updateCartCoords = () => {
            const cartBtn = document.querySelector('.navbar-actions .cart-btn');
            if (cartBtn) {
                const rect = cartBtn.getBoundingClientRect();
                setCartCoords({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
            }
        };

        updateCartCoords();
        window.addEventListener('resize', updateCartCoords);
        window.addEventListener('scroll', updateCartCoords); // Update on scroll too

        return () => {
            window.removeEventListener('resize', updateCartCoords);
            window.removeEventListener('scroll', updateCartCoords);
        };
    }, []);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal,
            cartCount
        }}>
            {children}

            {/* Render Flying Animations Globally */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 99999 }}>
                <AnimatePresence>
                    {flyingItems.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{
                                x: item.startX,
                                y: item.startY,
                                scale: 0.2,
                                opacity: 0
                            }}
                            animate={{
                                x: cartCoords.x,
                                y: cartCoords.y,
                                scale: [1, 2.5, 2.5, 0.5], // pop out huge, stay huge while flying, then shrink
                                opacity: [0, 1, 1, 0],
                                // A slight arc effect by utilizing the easing
                                rotate: [0, -15, 15, -10, 0]
                            }}
                            transition={{
                                duration: 1.2, // increased duration so it's visible longer
                                ease: [0.1, 0.7, 0.3, 1], // swoopy bezier curve
                                times: [0, 0.2, 0.8, 1]
                            }}
                            style={{
                                position: 'absolute',
                                x: '-50%', // center horizontal
                                y: '-50%', // center vertical
                                color: '#e83e8c', // A vibrant pop of color (classic "heart" pink/red)
                                filter: 'drop-shadow(0px 4px 8px rgba(232, 62, 140, 0.4))' // glow effect
                            }}
                        >
                            <Heart size={36} fill="#e83e8c" strokeWidth={1.5} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </CartContext.Provider>
    );
};
