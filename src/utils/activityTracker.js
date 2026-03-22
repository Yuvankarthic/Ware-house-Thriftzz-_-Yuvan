import BASE_URL from '../config/api';

const API = `${BASE_URL}/api`;

const safePost = async (url, payload) => {
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        });
    } catch (_err) {
        // Activity tracking is intentionally non-blocking.
    }
};

export const trackVisit = (page = 'homepage') => {
    safePost(`${API}/track-visit`, {
        page,
        timestamp: new Date().toISOString(),
    });
};

export const trackEvent = (event, productId = null, page = null) => {
    if (!event) return;

    safePost(`${API}/track-event`, {
        event,
        product_id: productId,
        page,
        timestamp: new Date().toISOString(),
    });
};
