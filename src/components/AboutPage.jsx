import React from 'react';
import { useHistory } from 'react-router-dom';
import BrandIntro from './BrandIntro';
import '../styles/AboutPage.css';

const AboutPage = () => {
    const history = useHistory();

    return (
        <div className="about-page">
            {/* Back Button */}
            <button className="about-page__back" onClick={() => history.goBack()} aria-label="Go back">
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
