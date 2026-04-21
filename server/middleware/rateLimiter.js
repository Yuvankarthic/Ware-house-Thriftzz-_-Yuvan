const rateLimitStore = new Map();

export function rateLimitMiddleware(options = {}) {
    const windowMs = options.windowMs || 60000;
    const maxRequests = options.maxRequests || 20;
    const keyPrefix = options.keyPrefix || 'rl:';
    
    return (req, res, next) => {
        const userId = req.user?.id || req.ip || 'anonymous';
        const key = `${keyPrefix}${userId}`;
        
        const now = Date.now();
        const record = rateLimitStore.get(key);
        
        if (!record) {
            rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        
        if (now > record.resetAt) {
            rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        
        if (record.count >= maxRequests) {
            return res.status(429).json({ 
                success: false, 
                error: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil((record.resetAt - now) / 1000)
            });
        }
        
        record.count++;
        rateLimitStore.set(key, record);
        next();
    };
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 60000);