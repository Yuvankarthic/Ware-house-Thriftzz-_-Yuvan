// ─────────────────────────────────────────────
//  Auth Routes  —  /api/auth/*
// ─────────────────────────────────────────────
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { generateToken, authMiddleware, roleMiddleware } from '../auth.js';

const router = Router();

// ── POST /api/auth/login ──
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔑 Login attempt for:', email);

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email/Username and password required' });
        }

        // Try email first, then name (case insensitive)
        const result = await query(
            'SELECT * FROM staff WHERE email = $1 OR LOWER(name) = $2', 
            [email.toLowerCase().trim(), email.toLowerCase().trim()]
        );
        console.log('👤 User found in DB:', result.rows.length > 0);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('✅ Password valid:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken(user);
        console.log('🎟️ Token generated successfully');

        return res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('❌ /api/auth/login error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error: ' + err.message });
    }
});

// ── POST /api/auth/quick-login (password-only) ──
router.post('/quick-login', async (req, res) => {
    try {
        const { password } = req.body;
        console.log('🔑 Quick login attempt (password-only)');

        if (!password) {
            return res.status(400).json({ success: false, error: 'Password required' });
        }

        // Check if password matches the warehouse password
        const WAREHOUSE_PASSWORD = 'wearhouse';
        if (password !== WAREHOUSE_PASSWORD) {
            return res.status(401).json({ success: false, error: 'Access Denied' });
        }

        // Create a temporary token with a generic user ID (0)
        // In OrderDetailPanel, user will select their name when handling an order
        const tempUser = { id: 0, name: 'GuestStaff', email: 'staff@warehouse.local', role: 'staff' };
        const token = generateToken(tempUser);

        console.log('✅ Quick login successful');
        return res.json({
            success: true,
            token,
            user: tempUser,
        });
    } catch (err) {
        console.error('❌ /api/auth/quick-login error:', err.message);
        return res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
    }
});

// ── GET /api/auth/me ──
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT id, name, email, role FROM staff WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        return res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('❌ /api/auth/me error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ── POST /api/auth/register (admin only) ──
router.post('/register', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Name, email, and password required' });
        }

        const existing = await query('SELECT id FROM staff WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = await query(
            `INSERT INTO staff (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
            [name, email.toLowerCase().trim(), hash, role || 'staff']
        );

        return res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('❌ /api/auth/register error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
