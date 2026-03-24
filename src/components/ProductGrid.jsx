import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductViewer from './ProductViewer';
import '../styles/ProductGrid.css';
import BASE_URL from '../config/api';
import { sanitizeImageList, sanitizeImageUrl } from '../utils/imageUrl';

const API = `${BASE_URL}/api`;

const mapApiProductToCard = (product) => ({
    id: `api-${product.id}`,
    name: product.name,
    price: Number(product.price) || 0,
    size: product.size || 'N/A',
    fit: product.fit || 'Regular',
    condition: product.condition || 'Vintage',
    category: product.category || 'Jackets',
    images: sanitizeImageList(product.image_urls || [product.image_url]),
    soldOut: Number(product.stock) <= 0,
    stock: Number(product.stock) || 0,
    show_on_main: product.show_on_main !== false,
    chest_length: product.chest_length || '',
    shoulder_length: product.shoulder_length || '',
});

const CATEGORY_OPTIONS = ['All', 'Jackets', 'Shirts', 'Pants'];
const normalizeCategory = (value = '') => {
    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return '';
    if (['jacket', 'jackets'].includes(normalized)) return 'Jackets';
    if (['shirt', 'shirts'].includes(normalized)) return 'Shirts';
    if (['pant', 'pants', 'trouser', 'trousers'].includes(normalized)) return 'Pants';
    return '';
};

const ProductGrid = () => {
    const panelRef = useRef(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const liveProducts = useMemo(() => {
        return apiProducts
            .map(mapApiProductToCard)
            .filter((p) => p.show_on_main && p.stock > 0);
    }, [apiProducts]);

    const allSizes = useMemo(() => ['All', ...Array.from(new Set(liveProducts.map((p) => p.size)))], [liveProducts]);

    const activeFilterCount = (activeCategory !== 'All' ? 1 : 0) + (activeSize !== 'All' ? 1 : 0);

    const filtered = liveProducts.filter((product) => {
        const productCategory = normalizeCategory(product.category) || 'Jackets';
        const categoryMatch = activeCategory === 'All' || productCategory === activeCategory;
        const sizeMatch = activeSize === 'All' || product.size === activeSize;
        return categoryMatch && sizeMatch;
    });

    const selectedProduct = selectedProductId
        ? liveProducts.find(p => p.id === selectedProductId)
        : null;

    return (
        <LayoutGroup>
            <section className="product-grid-section fresh-canvas-section" id="latest-drop">
                <div className="section-header-block shop-header-row" ref={panelRef}>
                    <div>
                        <span className="section-eyebrow">Latest Drop</span>
                        <h2 className="section-title">Fresh Canvas</h2>
                    </div>

                    <button
                        className="filter-btn"
                        type="button"
                        onClick={() => setIsFilterOpen((prev) => !prev)}
                    >
                        <SlidersHorizontal size={14} />
                        FILTER
                        {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
                    </button>

                    {isFilterOpen && (
                        <div className="filter-panel" role="dialog" aria-label="Filter products panel">
                            <p className="filter-section-label">CATEGORY</p>
                            {CATEGORY_OPTIONS.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    className={`filter-option ${activeCategory === category ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveCategory(category);
                                        setSelectedProductId(null);
                                    }}
                                >
                                    <span className="filter-dot" />
                                    {category}
                                </button>
                            ))}

                            <div className="filter-divider" />

                            <p className="filter-section-label">SIZE</p>
                            <div className="filter-size-row">
                                {allSizes.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        className={`filter-size-btn ${activeSize === size ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveSize(size);
                                            setSelectedProductId(null);
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>

                            {activeFilterCount > 0 && (
                                <button
                                    type="button"
                                    className="filter-clear"
                                    onClick={() => {
                                        setActiveCategory('All');
                                        setActiveSize('All');
                                        setSelectedProductId(null);
                                    }}
                                >
                                    CLEAR FILTERS
                                </button>
                            )}

                            <button
                                type="button"
                                className="filter-apply"
                                onClick={() => setIsFilterOpen(false)}
                            >
                                APPLY
                            </button>
                        </div>
                    )}
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
