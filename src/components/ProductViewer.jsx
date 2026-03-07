import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import '../styles/ProductViewer.css';

const ProductViewer = ({
    product,
    products,
    onClose,
    onNavigate
}) => {
    const { addToCart, setIsCartOpen } = useCart();
    // Using simple document.body block for quick scroll prevention
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!product) return null;

    const currentIndex = products.findIndex(p => p.id === product.id);
    const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png';

    const handleAddToCart = () => {
        if (!product.soldOut) {
            addToCart(product);
            setIsCartOpen(true);
        }
    };

    // Swipe handlers
    // If the user drags significantly horizontally, navigate. If they pull down significantly, close.
    const handleDragEnd = (event, info) => {
        const offset = info.offset;
        const velocity = info.velocity;

        // Horizontal Swipe
        if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
            if (offset.x < 0 && currentIndex < products.length - 1) {
                // Swipe Left -> Next
                onNavigate(products[currentIndex + 1].id);
            } else if (offset.x > 0 && currentIndex > 0) {
                // Swipe Right -> Prev
                onNavigate(products[currentIndex - 1].id);
            }
        }
        // Vertical Swipe (Pull down to close)
        else if (offset.y > 150 || velocity.y > 800) {
            onClose();
        }
    };

    return (
        <motion.div
            className="product-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
            <button className="viewer-close-btn" onClick={onClose} aria-label="Close Viewer">
                <X size={24} />
            </button>

            <div className="viewer-content">
                {/* 
                    The main image has layoutId to match the card, 
                    creating the "expand from card" effect.
                */}
                <motion.div
                    className="viewer-image-container"
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.8}
                    onDragEnd={handleDragEnd}
                >
                    <motion.img
                        src={primaryImage}
                        alt={product.name}
                        className="viewer-main-image"
                        layoutId={`product-image-${product.id}`}
                    />

                    {/* Navigation dots matching grid length */}
                    <div className="viewer-navigation-hints">
                        {products.map((p, idx) => (
                            <div
                                key={p.id}
                                className={`nav-dot ${idx === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Fade in the product details after image expands */}
                <motion.div
                    className="viewer-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                >
                    <div className="viewer-header">
                        <h1 className="viewer-title">{product.name}</h1>
                        <p className="viewer-price">₹{product.price}</p>
                    </div>

                    <div className="viewer-description">
                        <p>Authentic vintage piece, curated for WHT. Washed and ready to wear. Imperfections are part of the story.</p>
                    </div>

                    <div className="viewer-attributes">
                        <div className="viewer-attr">
                            <span className="viewer-attr-label">Size</span>
                            <span className="viewer-attr-value">{product.size}</span>
                        </div>
                        <div className="viewer-attr">
                            <span className="viewer-attr-label">Fit</span>
                            <span className="viewer-attr-value">{product.fit}</span>
                        </div>
                        <div className="viewer-attr">
                            <span className="viewer-attr-label">Condition</span>
                            <span className="viewer-attr-value">{product.condition}</span>
                        </div>
                    </div>

                    <button
                        className="viewer-add-btn"
                        onClick={handleAddToCart}
                        disabled={product.soldOut}
                    >
                        {product.soldOut ? 'Sold Out' : 'Add to Cart — ₹' + product.price}
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ProductViewer;
