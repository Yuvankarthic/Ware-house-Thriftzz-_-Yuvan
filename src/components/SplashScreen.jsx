import { useState, useEffect } from 'react';
import '../styles/SplashScreen.css';

export default function SplashScreen({ onComplete }) {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setFadeOut(true);
        }, 3000);

        const completeTimer = setTimeout(() => {
            onComplete();
        }, 3800);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            <span className="splash-background-text">WHT</span>
            <div className="splash-content">
                <h1 className="splash-main-text">Welcome to WHT</h1>
            </div>
        </div>
    );
}