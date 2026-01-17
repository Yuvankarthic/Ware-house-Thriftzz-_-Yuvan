import React, { useState, useEffect } from 'react';
import '../styles/WelcomeOverlay.css';

const WelcomeOverlay = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // Check if user has visited in this session
        const hasVisited = sessionStorage.getItem('wht_has_visited');

        if (!hasVisited) {
            setIsVisible(true);
            sessionStorage.setItem('wht_has_visited', 'true');

            // Start fade out after 3 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
                // Remove from DOM after fade out animation completes (800ms)
                setTimeout(() => {
                    setShouldRender(false);
                }, 800);
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            setShouldRender(false);
        }
    }, []);

    if (!shouldRender) return null;

    return (
        <div className={`welcome-overlay ${isVisible ? 'visible' : 'hidden'}`}>
            <div className="welcome-content">
                <h1 className="welcome-title">WELCOME TO WHT</h1>
                <p className="welcome-subtitle">Curated thrift. Built for the street. 🖤</p>
                <p className="welcome-micro">One-of-one pieces. No mass production.</p>
            </div>
        </div>
    );
};

export default WelcomeOverlay;
