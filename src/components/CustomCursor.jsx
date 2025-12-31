import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import '../styles/CustomCursor.css';

const CustomCursor = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    // Mouse position state
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    // Spring physics for the "liquid" trail effect - OPTIMIZED for less lag
    const springConfig = { damping: 35, stiffness: 800, mass: 0.8 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            cursorX.set(e.clientX - 10); // Center the 20px cursor
            cursorY.set(e.clientY - 10);

            // Global hover detection logic
            const target = e.target;
            const isClickable = target.closest('a, button, .clickable, input, textarea, .slider-arrow, .thumbnail-btn, .product-card');

            setIsHovered(!!isClickable);
        };

        const handleClick = () => setIsClicked(true);
        const handleRelease = () => setIsClicked(false);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleClick);
        window.addEventListener('mouseup', handleRelease);

        // Hide default cursor
        document.body.style.cursor = 'none';

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleClick);
            window.removeEventListener('mouseup', handleRelease);
            document.body.style.cursor = 'auto'; // Cleanup
        };
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className={`custom-cursor ${isHovered ? 'hovered' : ''} ${isClicked ? 'clicked' : ''}`}
            style={{
                translateX: cursorXSpring,
                translateY: cursorYSpring,
            }}
        >
            <div className="cursor-dot"></div>
            <div className="cursor-outline"></div>
            {isHovered && <div className="cursor-text">VIEW</div>}
        </motion.div>
    );
};

export default CustomCursor;
