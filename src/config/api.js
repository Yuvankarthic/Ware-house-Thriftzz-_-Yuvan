/**
 * ─────────────────────────────────────────
 * API Configuration
 * ─────────────────────────────────────────
 * Centralized API base URL for all fetch calls
 * 
 * PRODUCTION: https://ware-house-thriftzz-yuvan.onrender.com
 * DEVELOPMENT: http://localhost:4000
 * 
 * Update this single value to change the backend for the entire application
 */

const BASE_URL = import.meta.env.VITE_API_URL ||
                                 (import.meta.env.DEV
                                     ? 'http://localhost:4000'
                                     : 'https://ware-house-thriftzz-yuvan.onrender.com');

let keepAliveTimer = null;

export const startKeepAlivePing = () => {
    if (keepAliveTimer || typeof window === 'undefined') return;

    const pingHealth = () => {
        fetch(`${BASE_URL}/health`).catch(() => {});
    };

    pingHealth();
    keepAliveTimer = window.setInterval(pingHealth, 14 * 60 * 1000);
};

export { BASE_URL };
export default BASE_URL;
