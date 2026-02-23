import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { addToCart } = useCart();

    const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png';
    const hoverImage = product.images && product.images.length > 1 ? product.images[1] : primaryImage;
    const productLink = `/product/${product.id}`;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product.soldOut) addToCart(product);
    };

    return (
        <Link
            to={productLink}
            className={`product-card ${product.soldOut ? 'is-sold-out' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card-image-wrapper">
                <img
                    src={isHovered && !product.soldOut ? hoverImage : primaryImage}
                    alt={product.name || 'Product Image'}
                    className="card-image"
                    loading="lazy"
                />
                {/* Sold out overlay */}
                {product.soldOut && (
                    <div className="card-sold-overlay">
                        <span className="card-sold-label">Sold</span>
                    </div>
                )}
            </div>
            <div className="card-info">
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
        </Link>
    );
};

export default ProductCard;
