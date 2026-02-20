import React from 'react';
import BrandIntro from './BrandIntro';
import '../styles/AboutPage.css';

const AboutPage = () => {
    return (
        <div className="about-page">
            <BrandIntro />

            {/* Philosophy strip */}
            <div className="about-page__philosophy">
                <p className="about-page__philo-text">
                    WHT is a design house focused on singular, essential pieces. We reject the ephemeral
                    and champion the permanent. Each garment is an exploration of silhouette, material, and purpose.
                </p>
            </div>
        </div>
    );
};

export default AboutPage;
