import React, { useState, useEffect, useRef } from 'react';
import '../styles/WelcomeOverlay.css';

const WelcomeOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);
    const [startAnimation, setStartAnimation] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Audio ref (optional, per requirements "No sound changes")
    const audioRef = useRef(null);
    const touchStartY = useRef(0);

    // Check system preference for motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        // Check if user has visited in this session
        const hasVisited = sessionStorage.getItem('wht_has_visited');

        if (!hasVisited) {
            setShouldRender(true);
            // Slight delay to ensure paint before fading in
            const startTimer = setTimeout(() => {
                setIsVisible(true);
                setStartAnimation(true);
            }, 100);

            return () => clearTimeout(startTimer);
        } else {
            setShouldRender(false);
        }
    }, []);

    const triggerEntry = () => {
        if (isExiting) return;

        setIsExiting(true);
        sessionStorage.setItem('wht_has_visited', 'true');

        // Play sound if available (subtle)
        if (audioRef.current) {
            audioRef.current.volume = 0.1;
            audioRef.current.play().catch(e => { /* Ignore autoplay blocks */ });
        }

        // Wait for exit animation (approx 2s) then unmount
        setTimeout(() => {
            setIsVisible(false); // Fades out via CSS
            setTimeout(() => {
                setShouldRender(false);
            }, 2000); // 2s transition duration
        }, 100);
    };

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY; // Positive if swipe up

        if (diff > 40) { // Threshold for swipe up
            triggerEntry();
        }
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`welcome-overlay ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
            onClick={triggerEntry}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="background-noise"></div>

            <div className="welcome-content-wrapper">
                {/* 
                   The Image: Contains the WHT Abstract Art.
                   We use mix-blend-mode to integrate it.
                */}
                <div className={`graphic-container ${startAnimation && !prefersReducedMotion ? 'animate' : ''}`}>
                    <img
                        src="/welcome_graphic.png"
                        alt="WHT Abstract"
                        className="welcome-graphic"
                    />
                </div>

                {/* 
                   The Text Mask: A solid block color that sits ON TOP of the image's bottom half 
                   to hide the baked-in text/UFO, but BEHIND our new HTML text.
                */}
                <div className="text-mask-patch"></div>

                {/* 
                   HTML Typography: Replaces the baked text for sharpness and optimization.
                */}
                <div className={`text-container ${startAnimation && !prefersReducedMotion ? 'animate' : ''}`}>
                    <h2 className="tagline-primary">CURATED THRIFT. BUILT FOR THE STREET.</h2>
                    <p className="tagline-secondary">One-of-one pieces. No mass production.</p>
                </div>
            </div>

            {/* UFO Interaction - Bottom Right */}
            <div
                className={`ufo-container ${startAnimation ? 'visible' : ''} ${isExiting && !prefersReducedMotion ? 'flying' : ''}`}
            >
                <svg
                    className="ufo-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M2 12h20" />
                    <path d="M5 12v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
                    <path d="M12 12V6a4 4 0 0 0-4 4" />
                    <path d="M12 12v-6a4 4 0 0 1 4 4" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                </svg>
                <span className="ufo-hint">Swipe up</span>
            </div>

            {/* Hidden Audio */}
            <audio ref={audioRef} src="/sounds/woosh.mp3" preload="auto" />
        </div>
    );
};

export default WelcomeOverlay;
