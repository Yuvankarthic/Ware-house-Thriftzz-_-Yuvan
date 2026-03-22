import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { trackEvent } from '../utils/activityTracker';
import { sanitizeImageUrl } from '../utils/imageUrl';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [flyingItems, setFlyingItems] = useState([]);
    const [checkoutEntryStep, setCheckoutEntryStep] = useState('cart');

    const getNumericProductId = (product) => {
        const idValue = String(product?.id || '');
        const matchedApiId = idValue.match(/^api-(\d+)$/);
        if (matchedApiId) return Number.parseInt(matchedApiId[1], 10);
        const parsed = Number.parseInt(idValue, 10);
        return Number.isInteger(parsed) ? parsed : null;
    };

    const addToCart = (product, event = null) => {
        trackEvent('add_to_cart', getNumericProductId(product));

        // 1. Add item to cart state implicitly (don't open drawer yet)
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                // Since items are 1-of-1, we do not increment quantity.
                // We simply return the previous state.
                return prev;
            }
            return [...prev, {
                ...product,
                image: sanitizeImageUrl(product.images ? product.images[0] : product.image_url, null),
                quantity: 1 // Keeping quantity for legacy compatibility, but it will only ever be 1
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
            }, 1800); // Wait 1800ms for longer animation
        } else {
            // No event provided (fallback), open drawer immediately
            setIsCartOpen(true);
        }
    };

    const buyNow = (product) => {
        if (!product || product.soldOut) return;

        trackEvent('buy_now', getNumericProductId(product));

        setCartItems([
            {
                ...product,
                image: sanitizeImageUrl(product.images ? product.images[0] : product.image_url, null),
                quantity: 1,
            },
        ]);
        setCheckoutEntryStep('details');
        setIsCartOpen(true);
    };

    const consumeCheckoutEntryStep = () => {
        const currentStep = checkoutEntryStep;
        setCheckoutEntryStep('cart');
        return currentStep;
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        // Disabled updating quantity since items are 1-of-1
        console.warn("Items are 1-of-1. Quantity cannot be updated.");
    };

    const cartTotal = cartItems.reduce((acc, item) => acc + item.price, 0); // Removed quantity multiplier
    const cartCount = cartItems.length; // Simply count the number of unique items

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
            buyNow,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal,
            cartCount,
            consumeCheckoutEntryStep,
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
                                duration: 2.0, // increased duration so it's much slower and visible
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
