import React from 'react';
import ProductCard from './ProductCard';
import { products } from '../data/products';
import { motion } from 'framer-motion';
import '../styles/LatestDrop.css';

const LatestDrop = () => {
    return (
        <section id="latest-drop" className="section latest-drop-section">
            <div className="container">
                <div className="section-header">
                    <motion.h2
                        className="section-title"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        LATEST DROP — LIMITED STOCK
                    </motion.h2>
                    <div className="section-line"></div>
                </div>

                <div className="product-grid">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LatestDrop;
