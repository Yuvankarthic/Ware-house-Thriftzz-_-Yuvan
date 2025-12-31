import React from 'react';
import { motion } from 'framer-motion';
import '../styles/AboutSection.css';

const AboutSection = () => {
    return (
        <section id="about" className="section about-section">
            <div className="container about-container">
                <div className="about-image-wrapper fade-in">
                    <img
                        src="/images/cropped-black-jacket.png"
                        alt="Vintage Streetwear Sourcing"
                        className="about-image"
                    />
                    <div className="about-overlay"></div>
                </div>

                <div className="about-content">
                    <motion.h2
                        className="about-title"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        Real thrift.<br />
                        No mass production.<br />
                        <span className="underline-anim">One piece at a time.</span>
                    </motion.h2>

                    <motion.div
                        className="about-text"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <p>
                            WHT defines the anti-fast fashion movement. We don't do warehouses of generics.
                            We hand-pick vintage heat that tells a story of the street.
                            From 90s workwear to Y2K grails, every piece is authenticated,
                            cleaned, and dropped in limited batches.
                        </p>
                        <a href="#latest-drop" className="btn-link">Shop The Collection</a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
