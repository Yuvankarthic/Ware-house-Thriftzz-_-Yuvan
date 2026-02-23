import React from 'react';
import ProductCard from './ProductCard';
import '../styles/ProductGrid.css';
import { products } from '../data/products';

const ProductGrid = () => {
    return (
        <section className="product-grid-section" id="latest-drop">
            <div className="section-header-block">
                <span className="section-eyebrow">Latest Drop</span>
                <h2 className="section-title">New Arrivals</h2>
            </div>
            <div className="product-grid-inner">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
};

export default ProductGrid;
