import React, { useEffect, useMemo, useState } from 'react';
import { Check, Heart, Plus } from 'lucide-react';
import { useHistory, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../styles/ProductGrid.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';
const CATEGORY_OPTIONS = ['Jackets', 'Shirts', 'Pants'];
const CATEGORY_BANNERS = {
  Jackets: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200',
  Shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200',
  Pants: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200',
};

const mapApiProductToCard = (product) => ({
  id: `api-${product.id}`,
  name: product.name,
  price: Number(product.price) || 0,
  size: product.size || 'N/A',
  fit: product.fit || 'Regular',
  condition: product.condition || 'Vintage',
  category: product.category || 'Jackets',
  image_url: product.image_url || PLACEHOLDER_IMAGE,
  stock: Number(product.stock) || 0,
  chest_length: product.chest_length || '',
  shoulder_length: product.shoulder_length || '',
});

const normalizeCategory = (value = '') => {
  const matched = CATEGORY_OPTIONS.find((option) => option.toLowerCase() === String(value).toLowerCase());
  return matched || '';
};

export default function Shop() {
  const history = useHistory();
  const location = useLocation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedProductId, setAddedProductId] = useState(null);

  const selectedCategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return normalizeCategory(params.get('category'));
  }, [location.search]);

  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      return;
    }

    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.products || [];
        const mapped = list
          .map(mapApiProductToCard)
          .filter((product) => product.stock > 0 && normalizeCategory(product.category) === selectedCategory);
        setProducts(mapped);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  const typeOptions = useMemo(() => {
    const set = new Set(products.map((product) => product.fit || 'Regular'));
    return Array.from(set);
  }, [products]);

  const [activeType, setActiveType] = useState('All Types');

  useEffect(() => {
    setActiveType('All Types');
  }, [selectedCategory]);

  const visibleProducts = useMemo(() => {
    if (activeType === 'All Types') return products;
    return products.filter((product) => (product.fit || 'Regular') === activeType);
  }, [activeType, products]);

  const openCategory = (category) => {
    history.push(`/shop?category=${encodeURIComponent(category)}`);
  };

  const handleAddToCart = (product, event) => {
    addToCart(product, event);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  };

  return (
    <section className="product-grid-section" id="shop-grid">
      <div className="shop-category-banners" aria-label="Shop Categories">
        <button
          type="button"
          className="category-banner category-banner-jackets"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Jackets})` }}
          onClick={() => openCategory('Jackets')}
        >
          <span className="category-banner-title">JACKETS</span>
          <span className="category-banner-button">Explore Jackets →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-shirts"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Shirts})` }}
          onClick={() => openCategory('Shirts')}
        >
          <span className="category-banner-title">SHIRTS</span>
          <span className="category-banner-button">Explore Shirts →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-pants"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Pants})` }}
          onClick={() => openCategory('Pants')}
        >
          <span className="category-banner-title">PANTS</span>
          <span className="category-banner-button">Explore Pants →</span>
        </button>
      </div>

      {selectedCategory && (
        <>
          <div className="section-header-block">
            <span className="section-eyebrow">Category</span>
            <h2 className="section-title">{selectedCategory}</h2>
          </div>

          <div className="size-filter-bar">
            <button
              type="button"
              className={`size-pill ${activeType === 'All Types' ? 'active' : ''}`}
              onClick={() => setActiveType('All Types')}
            >
              All Types
            </button>
            {typeOptions.map((type) => (
              <button
                type="button"
                key={type}
                className={`size-pill ${activeType === type ? 'active' : ''}`}
                onClick={() => setActiveType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="product-grid-inner">
            {loading && <p className="grid-empty">Loading {selectedCategory.toLowerCase()}...</p>}
            {!loading && visibleProducts.length === 0 && (
              <p className="grid-empty">No {selectedCategory.toLowerCase()} products available right now.</p>
            )}

            {!loading && visibleProducts.length > 0 && visibleProducts.map((product) => {
              const inWishlist = isInWishlist(product.id);
              const isAdded = addedProductId === product.id;

              return (
                <article key={product.id} className="admin-product-card shop-admin-product-card">
                  <div className="admin-product-image-wrap">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="admin-product-image" />
                    ) : (
                      <div className="admin-product-no-image">No Image</div>
                    )}

                    <button
                      type="button"
                      className={`shop-card-wishlist ${inWishlist ? 'active' : ''}`}
                      onClick={() => toggleWishlist(product)}
                      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={18} className={inWishlist ? 'fill-current' : ''} />
                    </button>
                  </div>

                  <div className="admin-product-content">
                    <h3>{product.name}</h3>
                    <p className="admin-product-price">₹{product.price}</p>
                    <p className="admin-product-meta">Size: {product.size || '-'} | Type: {product.fit || '-'}</p>
                    <p className="admin-product-meta">Condition: {product.condition || '-'}</p>
                    {(product.chest_length || product.shoulder_length) && (
                      <p className="admin-product-meta">
                        Chest: {product.chest_length || '-'} | Shoulder: {product.shoulder_length || '-'}
                      </p>
                    )}

                    <button
                      type="button"
                      className="shop-add-to-cart-btn"
                      onClick={(event) => handleAddToCart(product, event)}
                    >
                      {isAdded ? <Check size={16} /> : <Plus size={16} />}
                      {isAdded ? 'Added' : 'Add to Cart'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
