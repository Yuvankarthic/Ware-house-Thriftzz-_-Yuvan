// ─────────────────────────────────────────────
//  Staff Routes  —  /api/staff/*
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
const query = (text, params) => pool.query(text, params);
import { authMiddleware, roleMiddleware } from '../auth.js';
import bcrypt from 'bcryptjs';

const router = Router();
const CORE_PICKERS = ['Akash', 'Vishwa', 'Yuvan'];

let corePickersReady = false;

const ensureCorePickers = async () => {
    if (corePickersReady) return;

    const passwordHash = await bcrypt.hash('staff123', 10);

    for (const name of CORE_PICKERS) {
        const email = `${name.toLowerCase()}@wht.store`;
        await query(
            `INSERT INTO staff (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'staff')
             ON CONFLICT (email) DO NOTHING`,
            [name, email, passwordHash]
        );
    }

    corePickersReady = true;
};

// ── GET /api/staff  —  list all staff ──
router.get('/', authMiddleware, async (req, res) => {
    try {
        await ensureCorePickers();

        const result = await query(
            `SELECT id, name, email, role, created_at FROM staff ORDER BY created_at ASC`
        );
        return res.json({ success: true, staff: result.rows });
    } catch (err) {
        console.error('❌ GET /api/staff error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ── DELETE /api/staff/:id  (admin only) ──
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
        }
        await query('DELETE FROM staff WHERE id = $1', [req.params.id]);
        return res.json({ success: true, message: 'Staff removed' });
    } catch (err) {
        console.error('❌ DELETE /api/staff error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;

