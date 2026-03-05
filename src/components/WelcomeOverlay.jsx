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
                                {/* Premium 3D Green/White UFO SVG */}
                                <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="metalBrightWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#FFFFFF" />
                                            <stop offset="60%" stopColor="#F8FAFC" />
                                            <stop offset="100%" stopColor="#CBD5E1" />
                                        </linearGradient>
                                        <linearGradient id="metalDarkGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#22C55E" />
                                            <stop offset="50%" stopColor="#166534" />
                                            <stop offset="100%" stopColor="#064E3B" />
                                        </linearGradient>
                                        <linearGradient id="metalEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#86EFAC" />
                                            <stop offset="40%" stopColor="#22C55E" />
                                            <stop offset="100%" stopColor="#14532D" />
                                        </linearGradient>
                                        <linearGradient id="glassPremium" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                                            <stop offset="50%" stopColor="rgba(240,253,244,0.5)" />
                                            <stop offset="100%" stopColor="rgba(22,101,52,0.8)" />
                                        </linearGradient>
                                        <radialGradient id="engineCore" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                                            <stop offset="30%" stopColor="#86EFAC" stopOpacity="0.9" />
                                            <stop offset="70%" stopColor="#22C55E" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#064E3B" stopOpacity="0" />
                                        </radialGradient>
                                        <filter id="shadowPremium" x="-30%" y="-30%" width="160%" height="160%">
                                            <feDropShadow dx="0" dy="25" stdDeviation="15" floodOpacity="0.4" />
                                            <feDropShadow dx="0" dy="10" stdDeviation="5" floodOpacity="0.7" floodColor="#064E3B" />
                                        </filter>
                                        <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="8" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <filter id="highlightPremium">
                                            <feDropShadow dx="0" dy="-3" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.9" />
                                        </filter>
                                    </defs>

                                    <g filter="url(#shadowPremium)">
                                        {/* Extremely glowing engine ring */}
                                        <ellipse cx="200" cy="160" rx="70" ry="20" fill="url(#engineCore)" className="ufo-glow-idle" />

                                        {/* Bottom Thruster Housing */}
                                        <ellipse cx="200" cy="140" rx="140" ry="40" fill="url(#metalDarkGreen)" />

                                        {/* Middle White Hull Ring (Thick) */}
                                        <ellipse cx="200" cy="120" rx="160" ry="45" fill="url(#metalBrightWhite)" filter="url(#highlightPremium)" />
                                        <ellipse cx="200" cy="130" rx="158" ry="43" fill="none" stroke="#94A3B8" strokeWidth="4" />

                                        {/* Upper Green Armor Plating */}
                                        <ellipse cx="200" cy="115" rx="150" ry="40" fill="url(#metalEmerald)" />

                                        {/* Glowing Neon Green Divider Ring */}
                                        <ellipse cx="200" cy="113" rx="145" ry="38" fill="none" stroke="#4ADE80" strokeWidth="3" filter="url(#glowGreen)" />

                                        {/* Core White Structure */}
                                        <ellipse cx="200" cy="100" rx="110" ry="30" fill="url(#metalBrightWhite)" />
                                        <ellipse cx="200" cy="100" rx="100" ry="25" fill="none" stroke="#E2E8F0" strokeWidth="2" />

                                        {/* Premium Glass Dome */}
                                        <path d="M90 100 C 90 20, 310 20, 310 100" fill="url(#glassPremium)" stroke="#FFFFFF" strokeWidth="3" />

                                        {/* High-fidelity Window Reflections */}
                                        <path d="M120 70 C 160 30, 240 30, 280 70" fill="none" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.8" filter="blur(2px)" />
                                        <path d="M140 85 C 180 50, 220 50, 260 85" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.9" />

                                        {/* Cinematic Exiting Plasma Beam (Downwards from Thruster) */}
                                        {isExiting && (
                                            <motion.path
                                                d="M160 160 L 200 400 L 240 160 Z"
                                                fill="#86EFAC"
                                                initial={{ opacity: 0, scaleY: 0 }}
                                                animate={{ opacity: [0.9, 1, 0.9], scaleY: [1, 1.5, 1] }}
                                                transition={{ duration: 0.1, repeat: Infinity }}
                                                style={{ transformOrigin: "top center" }}
                                                filter="url(#glowGreen)"
                                            />
                                        )}
                                        {isExiting && (
                                            <motion.path
                                                d="M180 160 L 200 350 L 220 160 Z"
                                                fill="#FFFFFF"
                                                initial={{ opacity: 0, scaleY: 0 }}
                                                animate={{ opacity: [0.8, 1, 0.8], scaleY: [1, 1.3, 1] }}
                                                transition={{ duration: 0.08, repeat: Infinity }}
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
