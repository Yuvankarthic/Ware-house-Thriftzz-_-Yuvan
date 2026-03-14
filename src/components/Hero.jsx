import React, { useState, useEffect, useRef } from 'react';
import '../styles/Hero.css';

const TOTAL_FRAMES = 200;

const Hero = () => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const lastTimeRef = useRef();
    const imagesRef = useRef([]);
    const currentFrameRef = useRef(1);
    
    // Flag to ensure we only initialized once
    const loadedRef = useRef(false);

    const formatFrameNumber = (num) => {
        return num.toString().padStart(3, '0');
    };

    // Preload all images
    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        
        const preloadImages = () => {
            const tempImages = [];
            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const img = new Image();
                img.src = `/images/hero/ezgif-frame-${formatFrameNumber(i)}.jpg`;
                tempImages.push(img);
            }
            imagesRef.current = tempImages;
        };
        
        preloadImages();
    }, []);

    // Canvas rendering loop
    const animate = (time) => {
        if (!lastTimeRef.current) {
            lastTimeRef.current = time;
        }

        const deltaTime = time - lastTimeRef.current;

        // Approx 30fps (~33ms)
        if (deltaTime > 33) {
            currentFrameRef.current = (currentFrameRef.current % TOTAL_FRAMES) + 1;
            lastTimeRef.current = time;
            
            drawFrame();
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    const drawFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const img = imagesRef.current[currentFrameRef.current - 1];
        
        if (!img || !img.complete) return;
        
        // Handle High DPI displays for 4K crispness!
        const dpr = window.devicePixelRatio || 1;
        
        // Match CSS actual dimensions
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Enable high-quality smoothing & supersampling
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Object-fit cover logic for Canvas
        const imgRatio = img.width / img.height;
        const canvasRatio = rect.width / rect.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (canvasRatio > imgRatio) {
            drawWidth = rect.width;
            drawHeight = rect.width / imgRatio;
            offsetX = 0;
            offsetY = (rect.height - drawHeight) / 2;
        } else {
            drawHeight = rect.height;
            drawWidth = rect.height * imgRatio;
            offsetX = (rect.width - drawWidth) / 2;
            offsetY = 0;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    useEffect(() => {
        // Kick off loop
        requestRef.current = requestAnimationFrame(animate);
        
        // Handle resize to redraw immediately to avoid stretching
        window.addEventListener('resize', drawFrame);
        
        return () => {
            cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', drawFrame);
        };
    }, []);

    return (
        <section className="hero-section">
            {/* Rapid Movie Frame Sequence (Upgraded to Canvas 4K render) */}
            <div className="hero-movie-container">
                <canvas 
                    ref={canvasRef} 
                    className="hero-canvas"
                />
            </div>

            {/* Premium Overlays */}
            <div className="hero-grain-overlay" />
            <div className="hero-gradient-overlay" />

            {/* Big Flex. Small Check. */}
            <div className="hero-content">
                <div className="hero-text-container">
                    <h1 className="hero-headline">
                        <span className="headline-line">Big Flex,</span>
                        <span className="headline-line">Small Check.</span>
                    </h1>
                    <div className="hero-subline">
                        <p>Premium Vintage Streetwear.</p>
                    </div>
                    <div className="hero-brand-name">
                        WearHouse Thriftxzz
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

