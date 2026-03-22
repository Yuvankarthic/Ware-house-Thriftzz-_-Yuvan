import React from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/AboutPage.css';

const AboutPage = () => {
    const history = useHistory();

    return (
        <div className="about-page">
            <button className="about-page__back" onClick={() => history.goBack()} aria-label="Go back">
                <span className="about-page__back-arrow">←</span>
                <span className="about-page__back-label">Back</span>
            </button>

            <section className="about-page__content">
                <h1>About WHT</h1>
                <p>
                    WHT is a curated thrift store focused on quality one-of-one pieces.
                </p>
                <p>
                    We publish limited drops, keep product details clear, and ship with simple operations.
                </p>
                <p>
                    For support, use the contact details shared during checkout confirmation.
                </p>
            </section>
        </div>
    );
};

export default AboutPage;
