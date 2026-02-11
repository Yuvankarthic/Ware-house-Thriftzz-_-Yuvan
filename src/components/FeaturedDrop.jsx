import React from 'react';
import '../styles/FeaturedDrop.css';

const FeaturedDrop = () => {
    return (
        <section className="featured-drop-section">
            <div className="container drop-grid">
                <div className="drop-image-container">
                    <img 
                        src="/images/classic-trench-view1.png" 
                        alt="A person wearing a classic trench coat" 
                        className="drop-image"
                    />
                </div>
                <div className="drop-content-container">
                    <p className="drop-subtitle">Collection 01</p>
                    <h2 className="drop-title">The Archetype</h2>
                    <p className="drop-description">
                        A foundational wardrobe of essential, timeless pieces. Designed to be the last you'll ever need.
                    </p>
                    <a href="#latest-drop" className="btn-primary">
                        Explore Collection
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FeaturedDrop;
