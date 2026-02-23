import React, { useState, useEffect, useRef } from 'react';
import '../styles/Hero.css';

const TOTAL_FRAMES = 200;

const Hero = () => {
    const [currentFrame, setCurrentFrame] = useState(1);
    const requestRef = useRef();
    const lastTimeRef = useRef();

    // The frames are named ezgif-frame-001.jpg etc.
    const formatFrameNumber = (num) => {
        return num.toString().padStart(3, '0');
    };

    const animate = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
        }

        const deltaTime = time - lastTimeRef.current;

        // Approx 24fps = ~41.6ms per frame
        // Making it "very fast" -> let's try 30fps (~33ms)
        if (deltaTime > 33) {
            setCurrentFrame((prev) => (prev % TOTAL_FRAMES) + 1);
            lastTimeRef.current = time;
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <section className="hero-section">
            {/* Rapid Movie Frame Sequence */}
            <div className="hero-movie-container">
                <img
                    src={`/images/hero/ezgif-frame-${formatFrameNumber(currentFrame)}.jpg`}
                    alt="Cinematic Sequence"
                    className="hero-frame"
                />
            </div>

            {/* Premium Overlays */}
            <div className="hero-grain-overlay" />
            <div className="hero-gradient-overlay" />

            {/* Big Flex. Small Check. */}
            <div className="hero-content">
                <div className="hero-text-container">
                    <h1 className="hero-headline">
                        <span className="headline-line">Big Flex.</span>
                        <span className="headline-line">Small Check.</span>
                    </h1>
                    <div className="hero-subline">
                        <p>Premium Vintage Streetwear. Bengaluru.</p>
                    </div>
                    <div className="hero-actions">
                        <a href="#latest-drop" className="hero-cta-btn">
                            Shop the Drop
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
