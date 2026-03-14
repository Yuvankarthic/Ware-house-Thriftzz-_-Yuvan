// ─────────────────────────────────────────────
//  Staff Routes  —  /api/staff/*
// ─────────────────────────────────────────────
import { Router } from 'express';
import { query } from '../db.js';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router = Router();

// ── GET /api/staff  —  list all staff ──
router.get('/', authMiddleware, async (req, res) => {
    try {
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
