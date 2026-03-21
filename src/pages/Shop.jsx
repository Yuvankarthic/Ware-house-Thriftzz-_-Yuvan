import React from 'react';
import '../styles/ProductGrid.css';

const CATEGORY_BANNERS = {
  Jackets: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200',
  Shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200',
  Pants: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200',
};

export default function Shop() {
  return (
    <section className="product-grid-section" id="shop-grid">
      <div className="shop-category-banners" aria-label="Shop Categories">
        <button
          type="button"
          className="category-banner category-banner-jackets"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Jackets})` }}
        >
          <span className="category-banner-title">JACKETS</span>
          <span className="category-banner-button">Explore Jackets →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-shirts"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Shirts})` }}
        >
          <span className="category-banner-title">SHIRTS</span>
          <span className="category-banner-button">Explore Shirts →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-pants"
          style={{ backgroundImage: `url(${CATEGORY_BANNERS.Pants})` }}
        >
          <span className="category-banner-title">PANTS</span>
          <span className="category-banner-button">Explore Pants →</span>
        </button>
      </div>
    </section>
  );
}
