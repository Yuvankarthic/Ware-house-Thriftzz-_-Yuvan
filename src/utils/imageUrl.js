import { BASE_URL } from '../config/api';

const PLACEHOLDER_IMAGE = '/images/placeholder.jpg';

const isPrivateOrLocalHost = (hostname = '') => {
    const host = String(hostname || '').toLowerCase();
    if (!host) return true;
    if (host === 'localhost' || host === '0.0.0.0') return true;
    if (host === '::1') return true;
    if (/^127\./.test(host)) return true;
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    return false;
};

export const sanitizeImageUrl = (value, fallback = PLACEHOLDER_IMAGE) => {
    if (!value || typeof value !== 'string') return fallback;

    const raw = value.trim();
    if (!raw) return fallback;

    // Handle local placeholder image (served from Netlify/public directory)
    if (raw === PLACEHOLDER_IMAGE) return raw;

    // Append BASE_URL to internal upload paths
    if (raw.startsWith('/uploads')) {
        return `${BASE_URL}${raw}`;
    }

    if (raw.startsWith('/')) {
        // If it's some other relative path, you might want to return it raw or prepend BASE_URL depending on your setup.
        // Usually, user-uploaded images go to /uploads. 
        return raw;
    }
    
    if (raw.startsWith('data:image/')) return raw;

    try {
        const parsed = new URL(raw, window.location.origin);
        
        // If the URL points to any old localhost port (e.g., localhost:7070 or 3003), 
        // rewrite it to use the new BASE_URL
        if (isPrivateOrLocalHost(parsed.hostname)) {
            return `${BASE_URL}${parsed.pathname}${parsed.search}`;
        }

        const protocol = parsed.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') return fallback;

        // Force HTTPS for secure environments if the old URL was HTTP
        if (window.location.protocol === 'https:' && protocol === 'http:') {
            parsed.protocol = 'https:';
        }

        return parsed.toString();
    } catch {
        return fallback;
    }
};

export const sanitizeImageList = (images, fallback = PLACEHOLDER_IMAGE) => {
    if (!Array.isArray(images)) return [fallback];

    const cleaned = images
        .map((img) => sanitizeImageUrl(img, null))
        .filter(Boolean);

    return cleaned.length > 0 ? cleaned : [fallback];
};

export { PLACEHOLDER_IMAGE };
