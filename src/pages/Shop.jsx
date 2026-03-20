import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Heart, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../styles/ProductGrid.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';
const CATEGORY_OPTIONS = ['All', 'Jackets', 'Shirts', 'Pants'];
const CATEGORY_BANNERS = {
  Jackets: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800',
  Shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
  Pants: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
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
  images: [product.image_url || PLACEHOLDER_IMAGE],
  soldOut: Number(product.stock) <= 0,
  stock: Number(product.stock) || 0,
  chest_length: product.chest_length || '',
  shoulder_length: product.shoulder_length || '',
});

export default function Shop() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSize, setActiveSize] = useState('All');
  const [addedProductId, setAddedProductId] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const fetchProducts = () => {
      fetch(`${import.meta.env.VITE_API_URL}/api/products`)
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.products || [];
          setProducts(list.filter((p) => Number(p.stock) > 0));
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    };

    fetchProducts();
    const id = setInterval(fetchProducts, 5000);

    const onFocus = () => fetchProducts();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const liveProducts = useMemo(() => products.map(mapApiProductToCard).filter((p) => p.stock > 0), [products]);

  const allSizes = useMemo(() => ['All', ...Array.from(new Set(liveProducts.map((p) => p.size)))], [liveProducts]);

  const filteredProducts = useMemo(() => {
    return liveProducts.filter((p) => {
      const categoryMatch = activeCategory === 'All' || p.category === activeCategory;
      const sizeMatch = activeSize === 'All' || p.size === activeSize;
      return categoryMatch && sizeMatch;
    });
  }, [activeCategory, activeSize, liveProducts]);

  const selectCategory = (category) => {
    setActiveCategory(category);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="section-header-block">
        <span className="section-eyebrow">Shop</span>
        <h2 className="section-title">Fresh Reset</h2>
      </div>

      <div className="shop-category-banners" aria-label="Shop Categories">
        <button
          type="button"
          className="category-banner category-banner-jackets"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Jackets})` }}
          onClick={() => selectCategory('Jackets')}
        >
          <span className="category-banner-title">JACKETS</span>
          <span className="category-banner-button">Explore Jackets →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-shirts"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Shirts})` }}
          onClick={() => selectCategory('Shirts')}
        >
          <span className="category-banner-title">SHIRTS</span>
          <span className="category-banner-button">Explore Shirts →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-pants"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Pants})` }}
          onClick={() => selectCategory('Pants')}
        >
          <span className="category-banner-title">PANTS</span>
          <span className="category-banner-button">Explore Pants →</span>
        </button>
      </div>

      <div className="category-filter-bar">
        {CATEGORY_OPTIONS.map((category) => (
          <button
            key={category}
            className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(category);
            }}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="size-filter-bar">
        {allSizes.map((size) => (
          <button
            key={size}
            className={`size-pill ${activeSize === size ? 'active' : ''}`}
            onClick={() => {
              setActiveSize(size);
            }}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="product-grid-inner" ref={gridRef}>
        {loading ? (
          <p className="grid-empty">Loading products...</p>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
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
                  <p className="admin-product-meta">Size: {product.size || '—'} | Fit: {product.fit || '—'}</p>
                  <p className="admin-product-meta">Category: {product.category || 'Jackets'}</p>
                  <p className="admin-product-meta">Condition: {product.condition || '—'}</p>
                  {(product.chest_length || product.shoulder_length) && (
                    <p className="admin-product-meta">
                      Chest: {product.chest_length || '—'} | Shoulder: {product.shoulder_length || '—'}
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
          })
        ) : (
          <p className="grid-empty">All old products are removed. Add new items from admin to start fresh.</p>
        )}
      </div>
    </section>
  );
}
