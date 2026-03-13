import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../styles/ProductViewer.css';

const ProductViewer = ({
    product,
    products,
    onClose,
    onNavigate
}) => {
    const { addToCart, setIsCartOpen } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Reviews State (local for now, ideally moved to a context/backend later)
    const [reviews, setReviews] = useState([]);
    const [isWritingReview, setIsWritingReview] = useState(false);
    const [newReviewText, setNewReviewText] = useState('');

    const inWishlist = isInWishlist(product?.id);

    // Using simple document.body block for quick scroll prevention
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Reset image index when looking at a new product
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [product?.id]);

    if (!product) return null;

    const currentIndex = products.findIndex(p => p.id === product.id);
    const images = product.images && product.images.length > 0 ? product.images : ['/placeholder-image.png'];
    const currentImage = images[currentImageIndex] || images[0];

    const handleAddReview = (e) => {
        e.preventDefault();
        if (!newReviewText.trim()) return;

        const newReview = {
            id: Date.now(),
            text: newReviewText,
            author: "Guest User",
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rating: 5 // Defaulting to 5 for now
        };

        setReviews([newReview, ...reviews]);
        setNewReviewText('');
        setIsWritingReview(false);
    };

    const handleAddToCart = (e) => {
        if (!product.soldOut) {
            addToCart(product, e);
        }
    };

    // Swipe handlers
    // If the user drags significantly horizontally, navigate. If they pull down significantly, close.
    const handleDragEnd = (event, info) => {
        const offset = info.offset;
        const velocity = info.velocity;

        // Horizontal Swipe for Images
        if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 300) {
            if (offset.x < 0) {
                // Swipe Left -> Next Image
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
            } else if (offset.x > 0) {
                // Swipe Right -> Previous Image
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
            }
        }
        // Vertical Swipe (Pull down to close)
        else if (offset.y > 100 || velocity.y > 500) {
            onClose();
        }
    };

    return (
        <motion.div
            className="product-viewer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
            <button className="viewer-close-btn" onClick={onClose} aria-label="Close Viewer">
                <X size={24} />
            </button>

            <div className="viewer-content">
                {/* 
                    The main image has layoutId to match the card, 
                    creating the "expand from card" effect.
                */}
                <motion.div
                    className="viewer-image-container"
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.8}
                    onDragEnd={handleDragEnd}
                >
                    <motion.img
                        key={currentImage} // Key helps Framer Motion animate the src change if desired, though standard img works too
                        src={currentImage}
                        alt={`${product.name} - View ${currentImageIndex + 1}`}
                        className="viewer-main-image"
                        layoutId={`product-image-${product.id}`}
                    />

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                className="viewer-nav-arrow prev"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                                }}
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                className="viewer-nav-arrow next"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                                }}
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Navigation dots for product images */}
                    <div className="viewer-navigation-hints">
                        {images.length > 1 && images.map((img, idx) => (
                            <div
                                key={idx}
                                className={`nav-dot ${idx === currentImageIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Fade in the product details after image expands */}
                <motion.div
                    className="viewer-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                >
                    <div className="viewer-header">
                        <h1 className="viewer-title">{product.name}</h1>
                        <p className="viewer-price">₹{product.price}</p>
                    </div>

                    <div className="viewer-description">
                        <p>Authentic vintage piece, curated for WHT. Washed and ready to wear. Imperfections are part of the story.</p>
                    </div>

                    <div className="viewer-attributes">
                        <div className="viewer-attr">
                            <span className="viewer-attr-label">Size</span>
                            <span className="viewer-attr-value">{product.size}</span>
                        </div>
                        <div className="viewer-attr">
                            <span className="viewer-attr-label">Fit</span>
                            <span className="viewer-attr-value">{product.fit}</span>
                        </div>
                        <div className="viewer-attr">
                            <span className="viewer-attr-label">Condition</span>
                            <span className="viewer-attr-value">{product.condition}</span>
                        </div>
                    </div>

                    <div className="viewer-actions">
                        <button
                            className="viewer-add-btn"
                            onClick={(e) => handleAddToCart(e)}
                            disabled={product.soldOut}
                        >
                            {product.soldOut ? 'Sold Out' : 'Add to Cart — ₹' + product.price}
                        </button>
                        
                        <button 
                            className={`viewer-wishlist-btn ${inWishlist ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product);
                            }}
                            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        >
                            <Heart size={24} className={inWishlist ? "fill-current" : ""} />
                        </button>
                    </div>

                    {/* REVIEWS SECTION */}
                    <div className="viewer-reviews-section">
                        <div className="reviews-header-premium">
                            <h3>Customer Reviews</h3>
                            <div className="reviews-rating-premium">
                                <span className="rating-number">4.8</span>
                                <div className="stars">
                                    <Star size={14} className="fill-current text-black" />
                                    <Star size={14} className="fill-current text-black" />
                                    <Star size={14} className="fill-current text-black" />
                                    <Star size={14} className="fill-current text-black" />
                                    <Star size={14} className="fill-current text-black" opacity={0.3} />
                                </div>
                                <span className="reviews-count-premium">(12)</span>
                            </div>
                        </div>

                        <div className="reviews-list-premium">
                            {reviews.length === 0 ? (
                                <p className="no-reviews-msg">No reviews yet. Be the first to share your thoughts!</p>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review.id} className="review-message-ui">
                                        <div className="review-meta-premium">
                                            <span className="reviewer-name-premium">{review.author}</span>
                                            <span className="review-date-premium">{review.date}</span>
                                        </div>
                                        <p className="review-text-premium">"{review.text}"</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {isWritingReview ? (
                            <form className="add-review-form" onSubmit={handleAddReview}>
                                <textarea
                                    className="review-textarea"
                                    placeholder="What did you think about this piece?..."
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                    rows="3"
                                    required
                                />
                                <div className="review-form-actions">
                                    <button type="button" className="cancel-review-btn" onClick={() => setIsWritingReview(false)}>Cancel</button>
                                    <button type="submit" className="submit-review-btn">Post Review</button>
                                </div>
                            </form>
                        ) : (
                            <button 
                                className="write-review-btn-premium"
                                onClick={() => setIsWritingReview(true)}
                            >
                                Write a Review
                            </button>
                        )}
                    </div>

                </motion.div>
            </div>
        </motion.div>
    );
};

export default ProductViewer;
