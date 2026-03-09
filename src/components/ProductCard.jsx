import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product, onSelect }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const cardRef = useRef(null);
    const [added, setAdded] = useState(false);

    // Snappy spring config for "cartoon-cool" motion
    const springConfig = { damping: 15, stiffness: 150, mass: 0.5 };

    // Mouse tilt values
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, springConfig);
    const mouseYSpring = useSpring(y, springConfig);

    // Exaggerated rotation (up to 8deg)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

    const [isHovered, setIsHovered] = useState(false);

    const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png';
    const hoverImage = product.images && product.images.length > 1 ? product.images[1] : primaryImage;

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const handleTap = (e) => {
        // Prevent navigation if clicking "Add to Cart" button or Plus button
        if (e.target.closest('.btn-add-to-cart') || e.target.closest('.mobile-plus-btn')) return;

        // Use the onSelect prop if provided (for overlay viewers), else fallback to navigation
        if (onSelect) {
            onSelect();
        } else {
            // Mobile tactile feedback delay before navigation
            setTimeout(() => {
                navigate(`/product/${product.id}`);
            }, 200);
        }
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product.soldOut) {
            addToCart(product, e);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
        }
    };

    return (
        <motion.div
            ref={cardRef}
            className={`product-card ${product.soldOut ? 'is-sold-out' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleTap}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            whileHover={{
                y: -10,
                scale: 1.05,
                transition: { type: "spring", stiffness: 200, damping: 20 }
            }}
            whileTap={{
                scale: 0.98,
                transition: { duration: 0.1 }
            }}
        >
            {/* STAGGERED DEPTH: Image leaps out most (Z: 60px) */}
            <div className="card-image-wrapper" style={{ transform: "translateZ(60px)" }}>
                <motion.img
                    src={isHovered && !product.soldOut ? hoverImage : primaryImage}
                    alt={product.name || 'Product Image'}
                    className="card-image"
                    layoutId={`product-image-${product.id}`}
                    loading="lazy"
                    animate={{ scale: isHovered ? 1.15 : 1 }}
                    transition={{ type: "spring", ...springConfig }}
                />

                {product.soldOut && (
                    <div className="card-sold-overlay" style={{ transform: "translateZ(30px)" }}>
                        <span className="card-sold-label">Sold</span>
                    </div>
                )}
            </div>

            {/* Info floats at intermediate depth (Z: 30px) */}
            <div className="card-info" style={{ transform: "translateZ(30px)" }}>
                <div className="card-meta">
                    <span className="card-size">{product.size}</span>
                </div>
                <h3 className="card-name">{product.name}</h3>
                <div className="card-price-row">
                    <p className="card-price">₹{product.price}</p>

                    {/* Mobile-only plus button next to price */}
                    {!product.soldOut && (
                        <motion.button
                            className="mobile-plus-btn"
                            onClick={handleAddToCart}
                            whileTap={{ scale: 0.9 }}
                        >
                            <AnimatePresence mode="wait">
                                {added ? (
                                    <motion.div
                                        key="check"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                    >
                                        <Check size={16} strokeWidth={3} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="plus"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                    >
                                        <Plus size={16} strokeWidth={3} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    )}
                </div>

                {/* Desktop-only button */}
                <button
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={product.soldOut}
                    style={{ transform: "translateZ(40px)" }}
                >
                    {product.soldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </motion.div>
    );
};

export default ProductCard;
