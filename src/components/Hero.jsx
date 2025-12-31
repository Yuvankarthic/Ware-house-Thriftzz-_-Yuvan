import React from 'react';
import '../styles/Hero.css';

const Hero = () => {
    return (
        <section className="hero-section container">
            <div className="hero-grid">
                <div className="hero-text-column">
                    <h1 className="hero-title">
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-100">Curated</span>
                        </div>
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-200">Thrift.</span>
                        </div>
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-300 highlight-text">Built for</span>
                        </div>
                        <div className="overflow-hidden">
                            <span className="reveal-text delay-400">the Street.</span>
                        </div>
                    </h1>

                    <div className="hero-subtext">
                        <p className="fade-in delay-600">
                            Strictly vintage. No mass production. <br />
                            One-of-one pieces dropping weekly.
                        </p>
                    </div>

                    <div className="hero-cta fade-in delay-700">
                        <a href="#latest-drop" className="btn-primary">
                            Shop Latest Drop
                        </a>
                    </div>
                </div>

                <div className="hero-image-column fade-in delay-200">
                    <div className="image-wrapper">
                        <img
                            src="/images/hero-smoker.png"
                            alt="WHT Editorial Rapper Style"
                            className="hero-main-image"
                        />
                        <div className="image-badge">
                            <span>New Arrival</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="scroll-indicator fade-in delay-1000">
                <span>Explore</span>
                <div className="line"></div>
            </div>
        </section>
    );
};

export default Hero;
