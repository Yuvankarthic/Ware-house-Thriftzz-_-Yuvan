import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandIntro from './BrandIntro';
import '../styles/AboutPage.css';

const AboutPage = () => {
    const navigate = useNavigate();

    return (
        <div className="about-page">
            {/* Back Button */}
            <button className="about-page__back" onClick={() => navigate(-1)} aria-label="Go back">
                <span className="about-page__back-arrow">←</span>
                <span className="about-page__back-label">Back</span>
            </button>

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
