import React from 'react';
import { useHistory } from 'react-router-dom';

const WelcomeOverlay = () => {
    const history = useHistory();

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: '#000'
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

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '32px'
                }}
            >
                <h1
                    style={{
                        color: 'white',
                        fontSize: '48px',
                        fontWeight: '900',
                        letterSpacing: '8px',
                        textShadow: '0 0 30px rgba(0,0,0,0.8)'
                    }}
                >
                    WHT FASHION
                </h1>

                <button
                    onClick={() => history.push('/shop')}
                    style={{
                        border: '2px solid white',
                        color: 'white',
                        background: 'transparent',
                        padding: '14px 40px',
                        fontSize: '13px',
                        letterSpacing: '4px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = 'black';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = 'white';
                    }}
                >
                    ENTER STORE -&gt;
                </button>
            </div>
        </div>
    );
};

export default WelcomeOverlay;
