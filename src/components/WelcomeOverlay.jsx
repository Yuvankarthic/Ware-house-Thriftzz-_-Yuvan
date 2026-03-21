import React from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/WelcomeIntro.css';

const WelcomeOverlay = () => {
    const history = useHistory();
    const enterStore = () => history.push('/shop');

    return (
        <div
            className="welcome-intro"
            role="button"
            tabIndex={0}
            aria-label="Enter store"
            onClick={enterStore}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    enterStore();
                }
            }}
        >
            <video
                className="welcome-intro-video"
                autoPlay
                muted
                loop
                playsInline
            >
                <source src="/videos/HTML_Shutter_Animation_Prompt.mp4" type="video/mp4" />
            </video>
        </div>
    );
};

export default WelcomeOverlay;
