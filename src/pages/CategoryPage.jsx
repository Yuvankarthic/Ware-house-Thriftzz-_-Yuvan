import React, { useEffect, useMemo, useState } from 'react';
import { Check, Heart, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import '../styles/ProductGrid.css';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';
const VALID_CATEGORIES = ['Jackets', 'Shirts', 'Pants'];

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
  const matched = VALID_CATEGORIES.find((option) => option.toLowerCase() === String(value).toLowerCase());
  return matched || '';
};

export default function CategoryPage() {
  const { category } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const selectedCategory = useMemo(() => normalizeCategory(category), [category]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.products || [];
        const filtered = list
          .map(mapApiProductToCard)
          .filter((product) => product.stock > 0 && normalizeCategory(product.category) === selectedCategory);
        setProducts(filtered);
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

  const handleAddToCart = (product, event) => {
    addToCart(product, event);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  };

  return (
    <section className="product-grid-section" id="category-grid">
      <div className="section-header-block">
        <span className="section-eyebrow">Category</span>
        <h2 className="section-title">{selectedCategory || 'Category Not Found'}</h2>
      </div>

      {selectedCategory && (
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
      )}

      <div className="product-grid-inner">
        {!selectedCategory && <p className="grid-empty">Invalid category selected.</p>}
        {selectedCategory && loading && <p className="grid-empty">Loading {selectedCategory.toLowerCase()}...</p>}
        {selectedCategory && !loading && visibleProducts.length === 0 && (
          <p className="grid-empty">No {selectedCategory.toLowerCase()} products available right now.</p>
        )}

        {selectedCategory && !loading && visibleProducts.length > 0 && visibleProducts.map((product) => {
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
    </section>
  );
}
