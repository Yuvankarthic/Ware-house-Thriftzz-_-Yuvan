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
                                {/* 3D Green/White UFO SVG */}
                                <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="metalGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#4ADE80" />
                                            <stop offset="40%" stopColor="#22C55E" />
                                            <stop offset="100%" stopColor="#15803D" />
                                        </linearGradient>
                                        <linearGradient id="metalWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" />
                                            <stop offset="50%" stopColor="#E2E8F0" />
                                            <stop offset="100%" stopColor="#94A3B8" />
                                        </linearGradient>
                                        <linearGradient id="glass3D" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                                            <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                                            <stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
                                        </linearGradient>
                                        <radialGradient id="glowEngine" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                                            <stop offset="50%" stopColor="#86EFAC" stopOpacity="0.6" />
                                            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                                        </radialGradient>
                                        <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
                                            <feDropShadow dx="0" dy="20" stdDeviation="12" floodOpacity="0.4" />
                                            <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.6" floodColor="#15803D" />
                                        </filter>
                                        {/* 3D highlight filter */}
                                        <filter id="highlight">
                                            <feDropShadow dx="0" dy="-4" stdDeviation="4" floodColor="#FFFFFF" floodOpacity="0.6" />
                                        </filter>
                                    </defs>

                                    <g filter="url(#shadow3D)">
                                        {/* Engine Glow ring (idle Green/White) */}
                                        <ellipse cx="100" cy="80" rx="38" ry="12" fill="url(#glowEngine)" className="ufo-glow-idle" />

                                        {/* Main Hull base curve (3D bottom depth) */}
                                        <ellipse cx="100" cy="68" rx="80" ry="25" fill="#15803D" />

                                        {/* Main Hull (3D Green) */}
                                        <ellipse cx="100" cy="65" rx="80" ry="25" fill="url(#metalGreen)" filter="url(#highlight)" />

                                        {/* White Outer Rim */}
                                        <ellipse cx="100" cy="65" rx="80" ry="25" fill="none" stroke="url(#metalWhite)" strokeWidth="6" strokeOpacity="1" />

                                        {/* Inner Ring Details (White Accent) */}
                                        <ellipse cx="100" cy="65" rx="55" ry="14" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.9" />

                                        {/* 3D Glass Dome */}
                                        <path d="M50 55 C 50 15, 150 15, 150 55" fill="url(#glass3D)" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.8" />

                                        {/* Highlight on Dome for 3D effect */}
                                        <path d="M65 40 C 85 22, 115 22, 135 40" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7" filter="blur(2px)" />

                                        {/* Base Thruster Housing (White Metal) */}
                                        <path d="M68 85 L 85 95 L 115 95 L 132 85 Z" fill="url(#metalWhite)" />
                                        <path d="M72 85 L 85 93 L 115 93 L 128 85 Z" fill="#94A3B8" /> {/* Thruster shadow inside */}

                                        {/* Cinematic Plasma Thruster (Active only when exiting) */}
                                        {isExiting && (
                                            <motion.path
                                                d="M85 95 L 100 190 L 115 95 Z"
                                                fill="#86EFAC"
                                                initial={{ opacity: 0, scaleY: 0 }}
                                                animate={{ opacity: [0.9, 1, 0.9], scaleY: [1, 1.4, 1] }}
                                                transition={{ duration: 0.12, repeat: Infinity }}
                                                style={{ transformOrigin: "top center" }}
                                            />
                                        )}
                                        {isExiting && (
                                            <motion.path
                                                d="M92 95 L 100 160 L 108 95 Z"
                                                fill="#FFFFFF"
                                                initial={{ opacity: 0, scaleY: 0 }}
                                                animate={{ opacity: [0.8, 1, 0.8], scaleY: [1, 1.2, 1] }}
                                                transition={{ duration: 0.1, repeat: Infinity }}
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
