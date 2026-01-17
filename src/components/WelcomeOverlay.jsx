import React, { useState, useEffect, useRef } from 'react';
import '../styles/WelcomeOverlay.css';

const WelcomeOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);
    const [showUfo, setShowUfo] = useState(false);
    const [isFlying, setIsFlying] = useState(false);

    // Audio ref
    const audioRef = useRef(null);
    const touchStartY = useRef(0);

    useEffect(() => {
        // Check if user has visited in this session
        const hasVisited = sessionStorage.getItem('wht_has_visited');

        if (!hasVisited) {
            setIsVisible(true);

            // Show UFO after 2 seconds
            const ufoTimer = setTimeout(() => {
                setShowUfo(true);
            }, 2000);

            return () => clearTimeout(ufoTimer);
        } else {
            setShouldRender(false);
        }
    }, []);

    const triggerEntry = () => {
        if (isFlying) return;

        setIsFlying(true);
        sessionStorage.setItem('wht_has_visited', 'true');

        // Play sound if available
        if (audioRef.current) {
            audioRef.current.volume = 0.2;
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }

        // Wait for UFO flight (approx 800ms) then fade out overlay
        setTimeout(() => {
            setIsVisible(false); // Start overlay fade out

            // Remove from DOM
            setTimeout(() => {
                setShouldRender(false);
            }, 800);
        }, 600);
    };

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY; // Positive if swipe up

        if (diff > 50) { // Threshold for swipe up
            triggerEntry();
        }
    };

    if (!shouldRender) return null;

    return (
        <div className={`welcome-overlay ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="background-noise"></div>

            <div className="welcome-content">
                <h1 className="welcome-title">WELCOME TO WHT</h1>
                <p className="welcome-subtitle">Curated thrift. Built for the street. 🖤</p>
                <p className="welcome-micro">One-of-one pieces. No mass production.</p>
            </div>

            {/* Micro Brand Tag */}
            <div className="micro-brand-tag">WHT / 2025</div>

            {/* UFO Interaction */}
            <div
                className={`ufo-container ${showUfo ? 'visible' : ''} ${isFlying ? 'flying' : ''}`}
                onClick={triggerEntry}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <svg
                    className="ufo-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M2 12h20" />
                    <path d="M5 12v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" />
                    <path d="M12 12V6a4 4 0 0 0-4 4" />
                    <path d="M12 12v-6a4 4 0 0 1 4 4" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                </svg>
                <span className="ufo-hint">SWIPE UP</span>
            </div>

            {/* Hidden Audio Element - ideally add a real file to public folder */}
            <audio ref={audioRef} src="/sounds/woosh.mp3" preload="auto" />
        </div>
    );
};

export default WelcomeOverlay;
