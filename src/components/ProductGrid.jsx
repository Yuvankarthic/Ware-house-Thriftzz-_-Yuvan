import React from 'react';
import ProductCard from './ProductCard';
import '../styles/ProductGrid.css';
import { products } from '../data/products';

const ProductGrid = () => {
    return (
        <section className="product-grid-section container">
            <h2 className="grid-title">All Products</h2>
            <div className="product-grid">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </section>
    );
};

export default ProductGrid;
