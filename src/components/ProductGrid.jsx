import React, { useState } from 'react';
import ProductCard from './ProductCard';
import '../styles/ProductGrid.css';
import { products } from '../data/products';

// Extract all unique sizes from products
const ALL_SIZES = ['All', ...Array.from(new Set(products.map(p => p.size)))];

const ProductGrid = () => {
    const [activeSize, setActiveSize] = useState('All');

    const filtered = activeSize === 'All'
        ? products
        : products.filter(p => p.size === activeSize);

    return (
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
                        onClick={() => setActiveSize(size)}
                    >
                        {size}
                    </button>
                ))}
            </div>

            <div className="product-grid-inner">
                {filtered.length > 0 ? (
                    filtered.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p className="grid-empty">No products in this size. Check back soon!</p>
                )}
            </div>
        </section>
    );
};

export default ProductGrid;
