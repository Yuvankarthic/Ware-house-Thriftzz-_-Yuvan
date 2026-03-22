import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/WelcomeIntro.css';

const WelcomeOverlay = () => {
    const history = useHistory();
    const enterStore = () => history.push('/shop');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            enterStore();
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, []);

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
            <div className="welcome-intro-content">
                <h1>WHT</h1>
                <p>Welcome to WHT</p>
            </div>
        </div>
    );
};

export default WelcomeOverlay;
