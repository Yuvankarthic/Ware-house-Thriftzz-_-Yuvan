import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductViewer from './ProductViewer';
import '../styles/ProductGrid.css';
import BASE_URL from '../config/api';
import { products } from '../data/products';

const API = `${BASE_URL}/api`;
const normalizeName = (value = '') => value.trim().toLowerCase();

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
    show_on_main: product.show_on_main !== false,
    chest_length: product.chest_length || '',
    shoulder_length: product.shoulder_length || '',
});

const ProductGrid = () => {
    const [activeSize, setActiveSize] = useState('All');
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [apiProducts, setApiProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = () => {
            fetch(`${API}/products`)
                .then((res) => res.json())
                .then((data) => {
                    const list = Array.isArray(data) ? data : data?.products || [];
                    setApiProducts(list);
                })
                .catch(() => setApiProducts([]));
        };

        fetchProducts();
        const id = setInterval(fetchProducts, 30000);
        return () => clearInterval(id);
    }, []);

    const mergedProducts = useMemo(() => {
        const apiVisible = apiProducts
            .map(mapApiProductToCard)
            .filter((p) => p.show_on_main && p.stock > 0);

        const apiNames = new Set(apiVisible.map((p) => normalizeName(p.name)));
        const hardcodedOnly = products.filter((p) => !apiNames.has(normalizeName(p.name)));

        return [...apiVisible, ...hardcodedOnly];
    }, [apiProducts]);

    const allSizes = useMemo(() => ['All', ...Array.from(new Set(mergedProducts.map((p) => p.size)))], [mergedProducts]);

    const filtered = activeSize === 'All'
        ? mergedProducts
        : mergedProducts.filter(p => p.size === activeSize);

    const selectedProduct = selectedProductId
        ? mergedProducts.find(p => p.id === selectedProductId)
        : null;

    return (
        <LayoutGroup>
            <section className="product-grid-section" id="latest-drop">
                <div className="section-header-block">
                    <span className="section-eyebrow">Latest Drop</span>
                    <h2 className="section-title">Fresh Canvas</h2>
                </div>

                {/* Size filter pills */}
                <div className="size-filter-bar">
                    {allSizes.map(size => (
                        <button
                            key={size}
                            className={`size-pill ${activeSize === size ? 'active' : ''}`}
                            onClick={() => {
                                setActiveSize(size);
                                setSelectedProductId(null); // Close viewer if filter changes
                            }}
                        >
                            {size}
                        </button>
                    ))}
                </div>

                <div className="product-grid-inner">
                    {filtered.length > 0 ? (
                        filtered.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onSelect={() => setSelectedProductId(product.id)}
                            />
                        ))
                    ) : (
                        <p className="grid-empty">All previous cards are cleared. New pieces will appear here soon.</p>
                    )}
                </div>
            </section>

            {/* Product Viewer Overlay */}
            <AnimatePresence>
                {selectedProductId && selectedProduct && (
                    <ProductViewer
                        key="product-viewer"
                        product={selectedProduct}
                        products={filtered}
                        onClose={() => setSelectedProductId(null)}
                        onNavigate={(id) => setSelectedProductId(id)}
                    />
                )}
            </AnimatePresence>
        </LayoutGroup>
    );
};

export default ProductGrid;
