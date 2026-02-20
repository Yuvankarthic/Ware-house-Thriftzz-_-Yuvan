import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import ProductImageSlider from './ProductImageSlider'; // NEW: Import the slider component
import '../styles/ProductPage.css';

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, setIsCartOpen } = useCart();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        const found = products.find(p => p.id === parseInt(id));
        if (found) {
            setProduct(found);
            window.scrollTo(0, 0);
        } else {
            // If product not found, redirect to home or a 404 page
            navigate('/');
        }
    }, [id, navigate]);

    if (!product) {
        // Render nothing or a loading spinner while the product is being found
        return null;
    }

    const handleAddToCart = () => {
        addToCart(product);
        setIsCartOpen(true); // Open cart drawer immediately after adding
    };

    return (
        <div className="product-page-container">
            {/* Back button */}
            <button className="product-page__back" onClick={() => navigate(-1)} aria-label="Go back">
                <span className="product-page__back-arrow">←</span>
                <span>Back</span>
            </button>

            <div className="product-grid">
                {/* Left Column: Image Slider (Replaces image gallery) */}
                <div className="product-gallery-column"> {/* Renamed for clarity */}
                    <ProductImageSlider images={product.images} /> {/* Use the new slider */}
                </div>

                {/* Right Column: Product Details (Sticky) */}
                <div className="product-details-wrapper">
                    <div className="product-details-sticky-content">
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-price">₹{product.price}</p>

                        <div className="product-description">
                            <p>
                                Authentic vintage piece, curated for WHT. Washed and ready to wear. Imperfections are part of the story.
                            </p>
                        </div>

                        <dl className="product-attributes">
                            <div className="attribute-item">
                                <dt className="attribute-label">Size</dt>
                                <dd className="attribute-value">{product.size}</dd>
                            </div>
                            <div className="attribute-item">
                                <dt className="attribute-label">Fit</dt>
                                <dd className="attribute-value">{product.fit}</dd>
                            </div>
                            <div className="attribute-item">
                                <dt className="attribute-label">Condition</dt>
                                <dd className="attribute-value">{product.condition}</dd>
                            </div>
                        </dl>

                        <button
                            className="btn-primary add-to-cart-btn"
                            onClick={handleAddToCart}
                            disabled={product.soldOut}
                        >
                            {product.soldOut ? 'Sold Out' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
