import React, { useEffect, useRef } from 'react';

import '../styles/Hero.css';

const Hero = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (heroRef.current) {
                heroRef.current.classList.add('loaded');
            }
        }, 100); // Small delay to ensure styles are applied

        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="hero-section" ref={heroRef}>
            <div className="hero-background-container clickable">
                <div
                    className="hero-background-image"
                    style={{ backgroundImage: `url('/images/hero-rapper-v2.png')` }}
                    aria-label="A model wearing WHT fashion"
                ></div>
            </div>

            <div className="hero-content-container container">
                <div className="hero-text-wrapper">
                    <h1 className="hero-title">
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-100">BIG FLEX. 💎</span>
                        </div>
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-200 check-line">SMALL CHECK. 💸</span>
                        </div>
                    </h1>
                    <p className="hero-subtext fade-in delay-500">
                        Premium vintage. No hype tax.
                    </p>
                </div>
            </div>

            <div className="hero-bottom-container">

                <a href="#latest-drop" className="scroll-down-link" aria-label="Scroll to next section">
                    <div className="scroll-down-arrow"></div>
                </a>
            </div>
        </section>
    );
};

export default Hero;
