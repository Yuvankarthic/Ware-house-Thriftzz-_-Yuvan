import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart } from 'lucide-react'; // Using Heart for the flying element
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [flyingHearts, setFlyingHearts] = useState([]);

  const handleAddToCart = (e) => {
    e.stopPropagation();

    // 1. Get click and target coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Cart icon position (approximate top-right fixed position)
    const endX = window.innerWidth - 80;
    const endY = 40;

    // 2. Add flying hearts (Burst of 3)
    const newHearts = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i,
      startX: startX + (Math.random() * 40 - 20), // Random jitter start
      startY: startY + (Math.random() * 40 - 20),
      endX: endX,
      endY: endY,
      delay: i * 0.08, // Staggered flight
      scale: 1 + Math.random() * 0.5, // Varying sizes (1.0 to 1.5)
      rotation: Math.random() * 90 - 45 // Random initial tilt
    }));

    setFlyingHearts(prev => [...prev, ...newHearts]);

    // 3. Trigger actual cart add
    addToCart(product);

    // 4. Remove hearts after animation
    setTimeout(() => {
      const idsToRemove = newHearts.map(h => h.id);
      setFlyingHearts(prev => prev.filter(h => !idsToRemove.includes(h.id)));
    }, 1500);
  };

  return (
    <>
      <motion.div
        className="product-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <div className="product-image-container">
          {/* Main Image (Flat) */}
          <div className="product-image-wrapper">
            <img
              src={product.images[0]}
              alt={`${product.name} - Main`}
              className="product-img product-img-main"
            />
            {/* Hover Image (Worn or Alternate) */}
            {product.images[1] && (
              <img
                src={product.images[1]}
                alt={`${product.name} - Detail`}
                className="product-img product-img-hover"
              />
            )}
          </div>

          {product.soldOut ? (
            <div className="status-badge sold-out">Sold Out</div>
          ) : (
            <>
              <div className="status-badge available">Only 1 Available</div>
              <button className="quick-add-btn" onClick={handleAddToCart} aria-label="Add to Cart">
                <Plus size={20} />
              </button>
            </>
          )}
        </div>

        <div className="product-info">
          <div className="product-header">
            <h3 className="product-name">{product.name}</h3>
            <span className="product-price">₹{product.price}</span>
          </div>
          <div className="product-meta">
            <span>{product.size}</span>
            <span className="separator">•</span>
            <span>{product.fit}</span>
            <span className="separator">•</span>
            <span className="condition-badge">{product.condition}</span>
          </div>
        </div>
      </motion.div>

      {/* Flying Heart Portal */}
      {createPortal(
        <AnimatePresence>
          {flyingHearts.map(heart => (
            <motion.div
              key={heart.id}
              initial={{
                position: 'fixed',
                left: heart.startX,
                top: heart.startY,
                x: '-50%',
                y: '-50%',
                scale: 0.5,
                opacity: 1,
                zIndex: 99999,
                pointerEvents: 'none',
                rotate: heart.rotation
              }}
              animate={{
                left: heart.endX,
                top: heart.endY,
                scale: heart.scale || 1.2,
                opacity: [1, 1, 0],
                rotate: 0 // Straighten out as it hits target
              }}
              transition={{
                duration: 0.7,
                delay: heart.delay || 0,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              {/* Solid Filled Heart, Larger Size for Visibility */}
              <Heart
                size={32}
                fill="#e63946" /* RED HEART */
                stroke="none"
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(230, 57, 70, 0.4))' /* Red Glow */
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ProductCard;
