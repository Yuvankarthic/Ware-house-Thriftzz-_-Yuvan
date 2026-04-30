import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Plus, Check, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageUrl';
import '../styles/ProductCard.css';

const ProductCard = ({ product, onSelect }) => {
    const history = useHistory();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const cardRef = useRef(null);
    const [added, setAdded] = useState(false);
    const [isHeartPopping, setIsHeartPopping] = useState(false);
    const inWishlist = isInWishlist(product.id);

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
    const primaryImage = sanitizeImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, PLACEHOLDER_IMAGE);
    const hoverImage = sanitizeImageUrl(product.images && product.images.length > 1 ? product.images[1] : primaryImage, PLACEHOLDER_IMAGE);

    const handleImageError = (e) => {
        if (e.currentTarget.src.includes(PLACEHOLDER_IMAGE)) {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.style.background = '#f0f0f0';
            }
            return;
        }

        e.currentTarget.src = PLACEHOLDER_IMAGE;
    };

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
        // Prevent navigation if clicking "Add to Cart" button or Plus button or Wishlist button
        if (e.target.closest('.btn-add-to-cart') || e.target.closest('.mobile-plus-btn') || e.target.closest('.card-wishlist-btn')) return;

        // Use the onSelect prop if provided (for overlay viewers), else fallback to navigation
        if (onSelect) {
            onSelect();
        } else {
            // Mobile tactile feedback delay before navigation
            setTimeout(() => {
                history.push(`/product/${product.id}`);
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
                <div className="card-badges" style={{ transform: 'translateZ(65px)' }}>
                    <span className="card-size-badge">{product.size || 'N/A'}</span>
                    <span className="card-condition-badge">{product.condition || 'Vintage'}</span>
                </div>

                <motion.img
                    src={isHovered && !product.soldOut ? hoverImage : primaryImage}
                    alt={product.name || 'Product Image'}
                    onError={handleImageError}
                    className="card-image"
                    layoutId={`product-image-${product.id}`}
                    loading="lazy"
                    animate={{ scale: isHovered ? 1.15 : 1 }}
                    transition={{ type: "spring", ...springConfig }}
                />

                <button 
                    className={`card-wishlist-btn ${inWishlist ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleWishlist(product);
                        setIsHeartPopping(true);
                        setTimeout(() => setIsHeartPopping(false), 280);
                    }}
                    onAnimationEnd={() => setIsHeartPopping(false)}
                    style={{ transform: "translateZ(70px)" }}
                    title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart size={20} className={`${inWishlist ? 'fill-current' : ''} ${isHeartPopping ? 'heart-pop' : ''}`} />
                </button>

                {product.soldOut && (
                    <div className="card-sold-overlay" style={{ transform: "translateZ(30px)" }}>
                        <span className="card-sold-label">Sold</span>
                    </div>
                )}
            </div>

            {/* Info floats at intermediate depth (Z: 30px) */}
            <div className="card-info" style={{ transform: "translateZ(30px)" }}>
                <h3 className="card-name">{product.name}</h3>
                {(product.chest_length || product.shoulder_length) && (
                    <p className="card-measurements">
                        Chest: {product.chest_length || '-'} | Shoulder: {product.shoulder_length || '-'}
                    </p>
                )}
                <div className="card-price-row">
                    <p className="card-price">₹{product.price}</p>

                    {/* Mobile-only plus button next to price */}
                    {!product.soldOut && (
                        <motion.button
                            className={`mobile-plus-btn ${added ? 'cart-pop' : ''}`}
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
                    className={`btn-add-to-cart ${added ? 'cart-pop' : ''}`}
                    onClick={handleAddToCart}
                    disabled={product.soldOut}
                    style={{ transform: "translateZ(40px)" }}
                >
                    {product.soldOut ? 'SOLD OUT' : 'ADD TO CART'}
                </button>
            </div>
        </motion.div>
    );
};

export default ProductCard;
