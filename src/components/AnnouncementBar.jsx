import React, { useState, useEffect } from 'react';
import '../styles/AnnouncementBar.css';

const messages = [
    '🚀 Same Day Delivery · Bangalore',
    '✦ Authentic Vintage. No Middleman.',
    '🖤 New Drop Live — Shop Now',
    '📦 Orders ship within 24 hours',
];

const AnnouncementBar = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setFading(true);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % messages.length);
                setFading(false);
            }, 350);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="announcement-bar">
            <span className={`announcement-text ${fading ? 'fade-out' : 'fade-in'}`}>
                {messages[currentIndex]}
            </span>
        </div>
    );
};

export default AnnouncementBar;
