import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { products as staticProducts } from '../data/products';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/activityTracker';
import ProductImageSlider from './ProductImageSlider';
import BASE_URL from '../config/api';
import '../styles/ProductPage.css';

const ProductPage = () => {
    const { id } = useParams();
    const history = useHistory();
    const { addToCart, buyNow } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            // Check static products first
            let found = staticProducts.find(p => p.id === parseInt(id));
            
            // If not found, it might be an API UUID (from category page)
            if (!found) {
                try {
                    const cleanId = id.replace('api-', '');
                    const res = await fetch(`${BASE_URL}/api/products`);
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data?.products || [];
                    const apiProduct = list.find(p => String(p.id) === cleanId);
                    
                    if (apiProduct) {
                        found = {
                            id: `api-${apiProduct.id}`,
                            name: apiProduct.name,
                            price: Number(apiProduct.price) || 0,
                            size: apiProduct.size || 'N/A',
                            fit: apiProduct.fit || 'Regular',
                            condition: apiProduct.condition || 'Vintage',
                            category: apiProduct.category || 'Jackets',
                            images: (Array.isArray(apiProduct.image_urls) && apiProduct.image_urls.length > 0) 
                                     ? apiProduct.image_urls 
                                     : [apiProduct.image_url || '/images/placeholder.jpg'],
                            stock: Number(apiProduct.stock) || 0,
                            soldOut: Number(apiProduct.stock) <= 0
                        };
                    }
                } catch (e) {
                    console.error('Failed to parse API product', e);
                }
            }

            if (found) {
                setProduct(found);
                window.scrollTo(0, 0);
                trackEvent('product_view', found.id, 'product_page');
            } else {
                // If product not found, redirect to shop
                history.push('/shop');
            }
            setLoading(false);
        };
        
        fetchProduct();
    }, [id, history]);

    if (loading || !product) {
        return <div className="product-page-container"><p>Loading...</p></div>;
    }

    const handleAddToCart = (e) => {
        addToCart(product, e);
    };

    const handleBuyNow = () => {
        buyNow(product);
    };

    return (
        <div className="product-page-container">
            {/* Back button */}
            <button className="product-page__back" onClick={() => history.goBack()} aria-label="Go back">
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

                    <div className="product-page-actions">
                        <button
                            className="btn-secondary buy-now-btn"
                            onClick={handleBuyNow}
                            disabled={product.soldOut}
                        >
                            {product.soldOut ? 'Sold Out' : 'Buy Now'}
                        </button>

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
        </div>
    );
};

export default ProductPage;
