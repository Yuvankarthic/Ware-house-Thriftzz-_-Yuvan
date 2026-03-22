import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../utils/imageUrl';
import '../styles/WishlistDrawer.css';

const WishlistDrawer = ({ onNavigate }) => {
    const { isWishlistOpen, setIsWishlistOpen, wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = (product, e) => {
        addToCart(product, e);
        // Optionally remove from wishlist after adding to cart
        // removeFromWishlist(product.id);
    };

    const handleProductClick = (productId) => {
        if (onNavigate) {
            onNavigate(productId);
            setIsWishlistOpen(false);
        }
    };

    return (
        <AnimatePresence>
            {isWishlistOpen && (
                <>
                    <motion.div
                        className="wishlist-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsWishlistOpen(false)}
                    />
                    <motion.div
                        className="wishlist-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                    >
                        <div className="wishlist-header">
                            <h2>Your Wishlist ({wishlistItems.length})</h2>
                            <button onClick={() => setIsWishlistOpen(false)} className="close-wishlist">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="wishlist-items-container">
                            {wishlistItems.length === 0 ? (
                                <div className="empty-wishlist">
                                    <p>Your wishlist is empty.</p>
                                    <button
                                        className="continue-shopping"
                                        onClick={() => setIsWishlistOpen(false)}
                                    >
                                        Explore Products
                                    </button>
                                </div>
                            ) : (
                                wishlistItems.map(item => (
                                    <div key={item.id} className="wishlist-item">
                                        <div 
                                            className="wishlist-item-image-wrapper"
                                            onClick={() => handleProductClick(item.id)}
                                        >
                                            <img
                                                src={sanitizeImageUrl(item.images?.[0], PLACEHOLDER_IMAGE)}
                                                alt={item.name}
                                                onError={(event) => {
                                                    event.currentTarget.src = PLACEHOLDER_IMAGE;
                                                }}
                                            />
                                        </div>
                                        <div className="wishlist-item-details">
                                            <div className="wishlist-item-header">
                                                <h3 onClick={() => handleProductClick(item.id)}>{item.name}</h3>
                                                <button
                                                    className="remove-item"
                                                    onClick={() => removeFromWishlist(item.id)}
                                                    title="Remove from wishlist"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <p className="wishlist-item-price">₹{item.price}</p>
                                            <button
                                                className="wishlist-add-cart"
                                                onClick={(e) => handleAddToCart(item, e)}
                                                disabled={item.soldOut}
                                            >
                                                {item.soldOut ? 'Sold Out' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WishlistDrawer;
