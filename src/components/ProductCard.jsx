import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext'; // NEW: Import useCart for adding to cart
import '../styles/ProductCard.css';

const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { addToCart } = useCart(); // NEW: Use the existing addToCart function

    // Default to the first image. If a second image exists, use it for hover.
    const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '/placeholder-image.png';
    const hoverImage = product.images && product.images.length > 1 ? product.images[1] : primaryImage;

    // Link directly to the product ID, as expected by ProductPage
    const productLink = `/product/${product.id}`;

    const handleAddToCart = (e) => {
        e.preventDefault(); // Prevent navigating to product page when clicking add to cart
        e.stopPropagation(); // Stop event bubbling to the Link
        addToCart(product);
        // Optionally, could open cart drawer here, but current useCart doesn't expose setIsCartOpen directly from here.
    };

    return (
        <Link
            to={productLink}
            className="product-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card-image-wrapper">
                <img
                    src={isHovered ? hoverImage : primaryImage}
                    alt={product.name || 'Product Image'}
                    className="card-image"
                />
            </div>
            <div className="card-info">
                <h3 className="card-name">{product.name}</h3>
                <p className="card-price">₹{product.price}</p>
                <button
                    className="btn-add-to-cart" // Custom class for styling the button within the card
                    onClick={handleAddToCart}
                    disabled={product.soldOut} // Disable if product is sold out
                >
                    {product.soldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;
