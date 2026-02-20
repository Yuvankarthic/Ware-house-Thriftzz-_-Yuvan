import React from 'react';
import '../styles/Marquee.css';

const Marquee = () => {
    return (
        <div className="marquee-container">
            <div className="marquee-content">
                <span>SAME DAY DELIVERY BANGALORE 🚀</span>
                <span className="separator">•</span>
                <span className="brand-font" style={{ fontSize: '1.2rem', letterSpacing: '0.2em' }}>WHT</span>
                <span className="separator">•</span>
                <span>AUTHENTIC VINTAGE</span>
                <span className="separator">•</span>
                <span>NEW DROP LIVE</span>
                <span className="separator">•</span>
                <span>SAME DAY DELIVERY BANGALORE 🚀</span>
                <span className="separator">•</span>
                <span className="brand-font" style={{ fontSize: '1.2rem', letterSpacing: '0.2em' }}>WHT</span>
                <span className="separator">•</span>
                <span>AUTHENTIC VINTAGE</span>
                <span className="separator">•</span>
                <span>NEW DROP LIVE</span>
                <span className="separator">•</span>
            </div>
        </div>
    );
};

export default Marquee;
