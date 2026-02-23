import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const cardRef = useRef(null);

    // Mouse tilt values
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
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
        // Prevent navigation if clicking "Add to Cart" button
        if (e.target.closest('.btn-add-to-cart')) return;

        // Mobile tactile feedback delay before navigation
        setTimeout(() => {
            navigate(`/product/${product.id}`);
        }, 200);
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product.soldOut) addToCart(product);
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
                y: -6,
                scale: 1.03,
                transition: { duration: 0.4, ease: "easeOut" }
            }}
            whileTap={{
                y: -4,
                scale: 1.02,
                transition: { duration: 0.1 }
            }}
        >
            <div className="card-image-wrapper" style={{ transform: "translateZ(20px)" }}>
                <motion.img
                    src={isHovered && !product.soldOut ? hoverImage : primaryImage}
                    alt={product.name || 'Product Image'}
                    className="card-image"
                    loading="lazy"
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                {product.soldOut && (
                    <div className="card-sold-overlay">
                        <span className="card-sold-label">Sold</span>
                    </div>
                )}
            </div>

            <div className="card-info" style={{ transform: "translateZ(10px)" }}>
                <div className="card-meta">
                    <span className="card-size">{product.size}</span>
                </div>
                <h3 className="card-name">{product.name}</h3>
                <p className="card-price">₹{product.price}</p>
                <button
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={product.soldOut}
                >
                    {product.soldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </motion.div>
    );
};

export default ProductCard;
