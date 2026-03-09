import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { default as ChevronUp } from 'lucide-react/dist/esm/icons/chevron-up'; // Explicit import to avoid conflicts
import '../styles/WelcomeOverlay.css';

const frameCount = 168; // New frame count for white-hoodie
const getFrameUrl = (index) => `/assets/white-hoodie/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

const WelcomeOverlay = () => {
    const [shouldRender, setShouldRender] = useState(true);
    const [isLaunched, setIsLaunched] = useState(false);
    const [swipeProgress, setSwipeProgress] = useState(0);

    const canvasRef = useRef(null);
    const imagesRef = useRef([]);
    const frameIndexRef = useRef(1);
    const animationRef = useRef(null);

    // Track interactions
    const isHolding = useRef(false);
    const startY = useRef(0);
    const isScrollLocked = useRef(false);

    useEffect(() => {
        // Check if user has visited in this session
        const hasVisited = sessionStorage.getItem('wht_has_visited');
        if (hasVisited) {
            setShouldRender(false);
            return;
        }

        // Preload images into memory
        let loadedCount = 0;
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = getFrameUrl(i);
            img.onload = () => {
                loadedCount++;
                // Draw the very first frame onto the canvas as soon as it's loaded
                if (i === 1 && canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            };
            imagesRef.current.push(img);
        }

        // Cleanup any playing animation on unmount
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const playLaunchAnimation = () => {
        // Prevent re-triggering
        if (isLaunched || isScrollLocked.current) return;
        setIsLaunched(true);
        isScrollLocked.current = true;
        sessionStorage.setItem('wht_has_visited', 'true');

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const renderFrame = () => {
            if (frameIndexRef.current >= frameCount) {
                // Animation sequence has finished, wait a small buffer then unmount
                setTimeout(() => setShouldRender(false), 200);
                return;
            }

            const img = imagesRef.current[frameIndexRef.current - 1];
            if (img && img.complete) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }

            frameIndexRef.current++;
            // We can control the speed of playback. Requesting every frame usually plays at ~60fps
            animationRef.current = requestAnimationFrame(renderFrame);
        };

        // Start playback
        animationRef.current = requestAnimationFrame(renderFrame);
    };

    // Interaction Handlers map to pointer (mouse/touch) on the button

    const handlePointerDown = (e) => {
        if (isScrollLocked.current) return;
        isHolding.current = true;
        startY.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isHolding.current || isScrollLocked.current) return;

        const deltaY = startY.current - e.clientY;
        if (deltaY > 0) {
            // Unzipping usually feels like pulling *down*, but user requested swipe *up* to open.
            // We use 100px as the 'full swipe' threshold
            const progress = Math.min(deltaY / 100, 1);
            setSwipeProgress(progress);

            if (deltaY >= 100) {
                isHolding.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
                playLaunchAnimation();
            }
        } else {
            setSwipeProgress(0);
        }
    };

    const handlePointerUp = (e) => {
        if (!isHolding.current) return;
        isHolding.current = false;
        setSwipeProgress(0); // Snap back if they didn't swipe far enough
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    if (!shouldRender) return null;

    return (
        <AnimatePresence>
            <motion.div
                // removed dark-futuristic class since hoodie sequence is brighter
                className="welcome-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
            >
                <div className="animation-scene">
                    <div className="canvas-container">
                        <canvas
                            ref={canvasRef}
                            width={800} /* Native resolution width of frames */
                            height={800}
                            className="sequence-canvas"
                        />
                    </div>

                    {/* Launch Button Area - positioned over the zipper */}
                    <motion.div
                        className="zipper-interaction-area"
                        animate={{ opacity: isLaunched ? 0 : 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="zipper-instruction" style={{ opacity: 1 - swipeProgress }}>
                            SWIPE UP TO UNZIP
                        </div>
                        <motion.div
                            className="zipper-button"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            // Move the zipper button up as they swipe
                            style={{ y: -swipeProgress * 100 }}
                        >
                            <div className="zipper-pull-inner">
                                <ChevronUp size={24} color="#000" strokeWidth={2.5} />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
