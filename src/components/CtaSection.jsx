import React from 'react';
import '../styles/CtaSection.css';

const CtaSection = () => {
    return (
        <section className="cta-section">
            <div className="container">
                <h2 className="cta-title">Become a Part of the Story</h2>
                <a href="#subscribe" className="btn-primary">
                    Join the WHT List
                </a>
            </div>
        </section>
    );
};

export default CtaSection;
