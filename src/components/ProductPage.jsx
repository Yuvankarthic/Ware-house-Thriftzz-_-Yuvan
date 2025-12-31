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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        if (!product || !product.images) return;
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        if (!product || !product.images) return;
        setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

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
                    {/* Gallery - Left (Slider) */}
                    <div className="product-layout-left">
                        <div className="product-slider-container">
                            <div className="product-slider-wrapper">
                                <motion.div
                                    className="product-slider-track"
                                    animate={{ x: `-${currentImageIndex * 100}%` }}
                                    transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.1}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = offset.x; // offset distance
                                        if (swipe < -50) nextImage();
                                        else if (swipe > 50) prevImage();
                                    }}
                                >
                                    {product.images.map((img, index) => (
                                        <div key={index} className="slider-slide">
                                            <img src={img} alt={`${product.name} view ${index + 1}`} className="slider-img" />
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Controls */}
                            {product.images.length > 1 && (
                                <>
                                    <button className="slider-arrow prev" onClick={prevImage}>
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button className="slider-arrow next" onClick={nextImage}>
                                        <ChevronLeft size={24} style={{ transform: 'rotate(180deg)' }} />
                                    </button>

                                    <div className="slider-dots">
                                        {product.images.map((_, index) => (
                                            <button
                                                key={index}
                                                className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                                                onClick={() => setCurrentImageIndex(index)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails (Desktop) */}
                        <div className="product-thumbnails">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    className={`thumbnail-btn ${index === currentImageIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                >
                                    <img src={img} alt={`Thumbnail ${index + 1}`} />
                                </button>
                            ))}
                        </div>
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
