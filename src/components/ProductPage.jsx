import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
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
            navigate('/');
        }
    }, [id, navigate]);

    if (!product) return null;

    const handleAddToCart = () => {
        addToCart(product);
        setIsCartOpen(true); // Open cart immediately
    };

    return (
        <div className="product-page">
            <div className="container product-page-container">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ChevronLeft size={20} /> Back
                </button>

                <div className="product-layout">
                    {/* Gallery - Left */}
                    {/* Gallery - Left */}
                    <div className="product-gallery">
                        {product.images.map((img, index) => (
                            <div key={index} className="gallery-item">
                                <img src={img} alt={`${product.name} view ${index + 1}`} className="gallery-img" />
                            </div>
                        ))}
                    </div>

                    {/* Details - Right */}
                    <div className="product-details-container">
                        <div className="product-details-sticky">
                            <h1 className="detail-title">{product.name}</h1>
                            <div className="detail-price">₹{product.price}</div>

                            {!product.soldOut && (
                                <div className="scarcity-badge">
                                    <span className="dot"></span> Only 1 available
                                </div>
                            )}

                            <div className="detail-chips">
                                <div className="chip">
                                    <span className="chip-label">Size</span>
                                    <span className="chip-value">{product.size}</span>
                                </div>
                                <div className="chip">
                                    <span className="chip-label">Fit</span>
                                    <span className="chip-value">{product.fit}</span>
                                </div>
                                <div className="chip condition">
                                    <span className="chip-label">Condition</span>
                                    <span className="chip-value">{product.condition}</span>
                                </div>
                            </div>

                            <div className="detail-description">
                                <p>Authentic vintage piece. Carefully sourced and curated.
                                    Washed and ready to wear. Imperfections are part of the story.</p>
                            </div>

                            <button
                                className="btn-add-to-cart"
                                onClick={handleAddToCart}
                                disabled={product.soldOut}
                            >
                                {product.soldOut ? 'Sold Out' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
