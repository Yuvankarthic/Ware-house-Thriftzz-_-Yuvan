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
                        <div className="hero-collage-grid">
                            <img src="/images/hero-collage/collage-1.jpg" alt="WHT View 1" className="collage-item" />
                            <img src="/images/hero-collage/collage-2.jpg" alt="WHT View 2" className="collage-item" />
                            <img src="/images/hero-collage/collage-3.jpg" alt="WHT View 3" className="collage-item" />
                            <img src="/images/hero-collage/collage-4.jpg" alt="WHT View 4" className="collage-item" />
                        </div>

                    </div>
                </div>
            </div>


        </section>
    );
};

export default Hero;
