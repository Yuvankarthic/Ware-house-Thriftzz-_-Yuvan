import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import '../styles/WelcomeOverlay.css';

const WelcomeOverlay = () => {
    const [shouldRender, setShouldRender] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    const controls = useAnimation();
    const y = useMotionValue(0);

    // Subtle drag resistance and limit
    const ufoY = useTransform(y, [-300, 100], [-300, 50]);

    useEffect(() => {
        // Check if user has visited in this session
        const hasVisited = sessionStorage.getItem('wht_has_visited');

        if (!hasVisited) {
            setShouldRender(true);
            // Start idle hover animation
            controls.start({
                y: [0, -15, 0],
                transition: {
                    duration: 4,
                    ease: "easeInOut",
                    repeat: Infinity,
                }
            });
        } else {
            setShouldRender(false);
        }
    }, [controls]);

    const handleDragEnd = (event, info) => {
        // If swiped up hard or dragged above threshold
        if (info.offset.y < -100 || info.velocity.y < -500) {
            triggerEntry();
        } else {
            // Snap back to idle
            controls.start({
                y: [0, -15, 0],
                transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                }
            }).then(() => {
                // Resume idle hover after snap back
                controls.start({
                    y: [0, -15, 0],
                    transition: {
                        duration: 4,
                        ease: "easeInOut",
                        repeat: Infinity,
                    }
                });
            });
        }
    };

    const triggerEntry = () => {
        if (isExiting) return;
        setIsExiting(true);
        sessionStorage.setItem('wht_has_visited', 'true');

        // Stop idle animation
        controls.stop();

        // Blast off animation
        controls.start({
            y: -1000,
            scale: 0.8,
            transition: {
                duration: 1.2,
                ease: [0.4, 0, 0.2, 1], // Cinematic easing
            }
        }).then(() => {
            // Unmount after blast off and fade out
            setTimeout(() => setShouldRender(false), 500);
        });
    };

    if (!shouldRender) return null;

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="welcome-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeOut", delay: 0.4 } }}
                >
                    <div className="ufo-scene">
                        {/* Interactive UFO */}
                        <motion.div
                            className="ufo-wrapper"
                            drag="y"
                            dragConstraints={{ top: -10, bottom: 0 }} /* Small local constraints, visual handled by dragElastic */
                            dragElastic={0.2}
                            style={{ y: ufoY }}
                            animate={controls}
                            onDragEnd={handleDragEnd}
                            whileTap={{ cursor: "grabbing" }}
                        >
                            <div className="ufo-body">
                                {/* Metallic UFO SVG */}
                                <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#E0E6ED" />
                                            <stop offset="50%" stopColor="#B3C0D1" />
                                            <stop offset="100%" stopColor="#7A8B99" />
                                        </linearGradient>
                                        <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                                            <stop offset="100%" stopColor="rgba(100,150,200,0.3)" />
                                        </linearGradient>
                                        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.8" />
                                            <stop offset="100%" stopColor="#4A90E2" stopOpacity="0" />
                                        </radialGradient>
                                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feDropShadow dx="0" dy="15" stdDeviation="10" floodOpacity="0.3" />
                                        </filter>
                                    </defs>

                                    <g filter="url(#shadow)">
                                        {/* Engine Glow ring (idle) */}
                                        <ellipse cx="100" cy="80" rx="35" ry="10" fill="url(#glow)" className="ufo-glow-idle" />

                                        {/* Main Hull */}
                                        <ellipse cx="100" cy="65" rx="80" ry="25" fill="url(#metal)" stroke="#5A6B7C" strokeWidth="2" />

                                        {/* Inner Ring Details */}
                                        <ellipse cx="100" cy="65" rx="60" ry="15" fill="none" stroke="#E0E6ED" strokeWidth="1" strokeOpacity="0.5" />

                                        {/* Glass Dome */}
                                        <path d="M50 55 C 50 20, 150 20, 150 55" fill="url(#glass)" stroke="#FFF" strokeWidth="1" strokeOpacity="0.6" />
                                        <path d="M60 45 C 80 25, 120 25, 140 45" fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" />

                                        {/* Base Thruster Engine */}
                                        <path d="M70 85 L 85 95 L 115 95 L 130 85 Z" fill="#2C3E50" />

                                        {/* Blast Thruster Glow (Active only when exiting) */}
                                        {isExiting && (
                                            <motion.path
                                                d="M85 95 L 100 160 L 115 95 Z"
                                                fill="#60A5FA"
                                                initial={{ opacity: 0, scaleY: 0 }}
                                                animate={{ opacity: [0.8, 1, 0.8], scaleY: [1, 1.2, 1] }}
                                                transition={{ duration: 0.2, repeat: Infinity }}
                                                style={{ transformOrigin: "top center" }}
                                            />
                                        )}
                                    </g>
                                </svg>
                            </div>
                        </motion.div>

                        {/* Ground Shadow */}
                        <motion.div
                            className="ufo-shadow"
                            animate={{ opacity: isExiting ? 0 : [0.4, 0.2, 0.4], scale: isExiting ? 0 : [1, 0.8, 1] }}
                            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                        />

                        {/* Instructional Text */}
                        <motion.div
                            className="entry-text"
                            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 20 : 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Swipe up to enter
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
