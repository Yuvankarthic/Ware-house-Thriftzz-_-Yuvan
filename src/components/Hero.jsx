import React from 'react';
import '../styles/Hero.css';

const Hero = () => {
    return (
        <section className="hero-section">
            {/* Front-page hero video only. Welcome page remains unchanged. */}
            <div className="hero-movie-container">
                <video
                    className="hero-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/herofront.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Premium Overlays */}
            <div className="hero-grain-overlay" />
            <div className="hero-gradient-overlay" />

            {/* Big Flex. Small Check. */}
            <div className="hero-content">
                <div className="hero-text-container">
                    <h1 className="hero-headline">
                        <span className="headline-line">Big Flex,</span>
                        <span className="headline-line">Small Check.</span>
                    </h1>
                    <div className="hero-subline">
                        <p>Premium Vintage Streetwear.</p>
                    </div>
                    <div className="hero-brand-name">
                        WearHouse Thriftxzz
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

