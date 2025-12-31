import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
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
  );
};

export default ProductCard;
