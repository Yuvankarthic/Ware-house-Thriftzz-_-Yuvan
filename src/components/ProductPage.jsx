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

    const handleAddToCart = (e) => {
        addToCart(product, e);
    };

    return (
        <div className="product-page-container">
            {/* Back button */}
            <button className="product-page__back" onClick={() => navigate(-1)} aria-label="Go back">
                <span className="product-page__back-arrow">←</span>
                <span>Back</span>
            </button>

            <div className="product-page__layout">
                {/* Image Section */}
                <div className="product-gallery-column">
                    <ProductImageSlider images={product.images} />
                </div>

                {/* Info Section */}
                <div className="product-details-wrapper">
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
                        onClick={(e) => handleAddToCart(e)}
                        disabled={product.soldOut}
                    >
                        {product.soldOut ? 'Sold Out' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
