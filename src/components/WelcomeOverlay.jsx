import React from 'react';
import { useHistory } from 'react-router-dom';

const WelcomeOverlay = () => {
    const history = useHistory();
    const enterStore = () => history.push('/shop');

    return (
        <div
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
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: '#000',
                cursor: 'pointer'
            }}
        >
            <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                }}
            >
                <source src="/videos/HTML_Shutter_Animation_Prompt.mp4" type="video/mp4" />
            </video>
        </div>
    );
};

export default WelcomeOverlay;
