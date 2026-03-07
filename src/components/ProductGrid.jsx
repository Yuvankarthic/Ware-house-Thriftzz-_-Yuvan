import React, { useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import ProductCard from './ProductCard';
import ProductViewer from './ProductViewer';
import '../styles/ProductGrid.css';
import { products } from '../data/products';

// Extract all unique sizes from products
const ALL_SIZES = ['All', ...Array.from(new Set(products.map(p => p.size)))];

const ProductGrid = () => {
    const [activeSize, setActiveSize] = useState('All');
    const [selectedProductId, setSelectedProductId] = useState(null);

    const filtered = activeSize === 'All'
        ? products
        : products.filter(p => p.size === activeSize);

    const selectedProduct = selectedProductId
        ? products.find(p => p.id === selectedProductId)
        : null;

    return (
        <LayoutGroup>
            <section className="product-grid-section" id="latest-drop">
                <div className="section-header-block">
                    <span className="section-eyebrow">Latest Drop</span>
                    <h2 className="section-title">New Arrivals</h2>
                </div>

                {/* Size filter pills */}
                <div className="size-filter-bar">
                    {ALL_SIZES.map(size => (
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
                        <p className="grid-empty">No products in this size. Check back soon!</p>
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
