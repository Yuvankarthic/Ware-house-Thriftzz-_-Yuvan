import React from 'react';
import '../styles/AboutSection.css';

const AboutSection = () => {
    return (
        <section className="about-section">
            <div className="container about-grid">
                <div className="about-content-container">
                    <p className="about-subtitle">Our Philosophy</p>
                    <h2 className="about-title">A Study in Form</h2>
                    <p className="about-description">
                        WHT is a design house focused on singular, essential pieces. We reject the ephemeral and champion the permanent. Each garment is an exploration of silhouette, material, and purpose.
                    </p>
                    <a href="#about" className="btn-secondary">
                        Read Our Story
                    </a>
                </div>
                <div className="about-image-container">
                    <img 
                        src="/images/hero-smoker.png" 
                        alt="A person in a stylish pose, representing the WHT brand ethos" 
                        className="about-image"
                    />
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
