// ─────────────────────────────────────────────
//  JWT Auth Helpers & Middleware
// ─────────────────────────────────────────────
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable');
}
const JWT_EXPIRY = '7d';

/**
 * Generate a JWT token for a user.
 */
export function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Auth middleware — requires valid JWT in Authorization header.
 */
export function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    try {
        const token = header.split(' ')[1];
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

/**
 * Role middleware — restricts to specific roles.
 */
export function roleMiddleware(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }
        next();
    };
}
