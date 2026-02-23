import React, { useEffect, useRef } from 'react';
import '../styles/Hero.css';

const Hero = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (heroRef.current) {
                heroRef.current.classList.add('loaded');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="hero-section" ref={heroRef}>
            {/* Full-bleed background image */}
            <div className="hero-background-container">
                <div
                    className="hero-background-image"
                    style={{ backgroundImage: `url('/images/hero-rapper-v2.png')` }}
                    aria-label="A model wearing WHT fashion"
                />
            </div>

            {/* Bottom gradient overlay */}
            <div className="hero-gradient-overlay" />

            {/* Text — bottom left, editorial */}
            <div className="hero-content-container">
                <div className="hero-text-wrapper">
                    <p className="hero-eyebrow fade-in delay-100">Premium Vintage</p>
                    <h1 className="hero-title">
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-200">Big Flex.</span>
                        </div>
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-350">Small Check.</span>
                        </div>
                    </h1>
                    <p className="hero-subtext fade-in delay-600">
                        No hype tax. No logo flex. Just the piece.
                    </p>
                    <a href="#latest-drop" className="hero-cta fade-in delay-800">
                        Shop the Drop
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Hero;
