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

console.log('🔗 API Base URL:', BASE_URL);

export { BASE_URL };
export default BASE_URL;
