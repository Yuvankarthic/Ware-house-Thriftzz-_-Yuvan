import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';
import '../styles/ProductGrid.css';

const CATEGORY_BANNERS = {
  Jackets: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200',
  Shirts: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200',
  Pants: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200',
};

export default function Shop() {
  const history = useHistory();
  const { settings } = useSiteSettings();

  const openCategory = (category) => {
    history.push(`/shop/${category.toLowerCase()}`);
  };

  return (
    <section className="product-grid-section shop-banners-section" id="shop-grid">
      <div className="shop-category-banners" aria-label="Shop Categories">
        <button
          type="button"
          className="category-banner category-banner-jackets"
          style={{ backgroundImage: `url()` }}
          onClick={() => openCategory('Jackets')}
        >
          <span className="category-banner-title">JACKETS</span>
          <span className="category-banner-button">Explore Jackets →</span>
        </button>

        <button
          type="button"
          className="category-banner category-banner-shirts"
          style={{ backgroundImage: `url()` }}
          onClick={() => openCategory('Shirts')}
        >
          <span className="category-banner-title">SHIRTS</span>
          <span className="category-banner-button">Explore Shirts →</span>
        </button>

        {settings.show_pants && (
          <button
            type="button"
            className="category-banner category-banner-pants"
            style={{ backgroundImage: `url()` }}
            onClick={() => openCategory('Pants')}
          >
            <span className="category-banner-title">PANTS</span>
            <span className="category-banner-button">Explore Pants →</span>
          </button>
        )}
      </div>
    </section>
  );
}