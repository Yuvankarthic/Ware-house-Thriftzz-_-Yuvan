import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import ProductViewer from '../components/ProductViewer';
import '../styles/ProductGrid.css';

const mapApiProductToCard = (product) => ({
  id: `api-${product.id}`,
  name: product.name,
  price: Number(product.price) || 0,
  size: product.size || 'N/A',
  fit: product.fit || 'Regular',
  condition: product.condition || 'Vintage',
  images: product.image_url ? [product.image_url] : [],
  soldOut: Number(product.stock) <= 0,
  stock: Number(product.stock) || 0,
  chest_length: product.chest_length || '',
  shoulder_length: product.shoulder_length || '',
});

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSize, setActiveSize] = useState('All');
  const [selectedProductId, setSelectedProductId] = useState(null);

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
    const id = setInterval(fetchProducts, 30000);
    return () => clearInterval(id);
  }, []);

  const liveProducts = useMemo(() => products.map(mapApiProductToCard).filter((p) => p.stock > 0), [products]);

  const allSizes = useMemo(() => ['All', ...Array.from(new Set(liveProducts.map((p) => p.size)))], [liveProducts]);

  const filteredProducts = useMemo(() => {
    if (activeSize === 'All') return liveProducts;
    return liveProducts.filter((p) => p.size === activeSize);
  }, [activeSize, liveProducts]);

  const selectedProduct = selectedProductId ? filteredProducts.find((p) => p.id === selectedProductId) : null;

  return (
    <LayoutGroup>
      <section className="product-grid-section" id="shop-grid">
        <div className="section-header-block">
          <span className="section-eyebrow">Shop</span>
          <h2 className="section-title">Fresh Thrift Drops</h2>
        </div>

        <div className="size-filter-bar">
          {allSizes.map((size) => (
            <button
              key={size}
              className={`size-pill ${activeSize === size ? 'active' : ''}`}
              onClick={() => {
                setActiveSize(size);
                setSelectedProductId(null);
              }}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="product-grid-inner">
          {loading ? (
            <p className="grid-empty">Loading products...</p>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => setSelectedProductId(product.id)}
              />
            ))
          ) : (
            <p className="grid-empty">No products in this size. Check back soon!</p>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedProductId && selectedProduct && (
          <ProductViewer
            key="shop-product-viewer"
            product={selectedProduct}
            products={filteredProducts}
            onClose={() => setSelectedProductId(null)}
            onNavigate={(id) => setSelectedProductId(id)}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
