import React, { createContext, useContext, useState, useEffect } from 'react';
import { sanitizeImageList, sanitizeImageUrl } from '../utils/imageUrl';

const WishlistContext = createContext();

export const useWishlist = () => {
    return useContext(WishlistContext);
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        if (!savedWishlist) return [];

        try {
            const parsed = JSON.parse(savedWishlist);
            if (!Array.isArray(parsed)) return [];

            return parsed.map((item) => ({
                ...item,
                images: sanitizeImageList(item?.images || [item?.image_url]),
                image_url: sanitizeImageUrl(item?.image_url, null),
            }));
        } catch {
            return [];
        }
    });
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToWishlist = (product) => {
        setWishlistItems(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) return prev; // already in wishlist
            return [...prev, product];
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    };

    const toggleWishlist = (product) => {
        const existingItem = wishlistItems.find(item => item.id === product.id);
        if (existingItem) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                isInWishlist,
                isWishlistOpen,
                setIsWishlistOpen
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};
