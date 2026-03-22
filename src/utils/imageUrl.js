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

    if (raw.startsWith('/')) return raw;
    if (raw.startsWith('data:image/')) return raw;

    try {
        const parsed = new URL(raw, window.location.origin);
        const protocol = parsed.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') return fallback;

        if (isPrivateOrLocalHost(parsed.hostname)) return fallback;

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
