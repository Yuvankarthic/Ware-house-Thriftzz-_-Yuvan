import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
const query = (text, params) => pool.query(text, params);

let opsTableReady = false;

const ensureOpsTable = async () => {
    if (opsTableReady) return;

    await query(`
        CREATE TABLE IF NOT EXISTS operations_logs (
            id          SERIAL PRIMARY KEY,
            check_date  DATE NOT NULL,
            status      VARCHAR(20) NOT NULL,
            notes       TEXT,
            created_by  INTEGER,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    opsTableReady = true;
};

router.get('/logs', authMiddleware, async (_req, res) => {
    try {
        await ensureOpsTable();

        const result = await query(
            `SELECT id, check_date, status, notes, created_by, created_at
             FROM operations_logs
             ORDER BY check_date DESC, created_at DESC
             LIMIT 100`
        );

        return res.json({ success: true, logs: result.rows });
    } catch (err) {
        console.error('GET /api/operations/logs error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.post('/logs', authMiddleware, async (req, res) => {
    try {
        await ensureOpsTable();

        const { date, status, notes } = req.body;

        if (!date || !status) {
            return res.status(400).json({ success: false, error: 'date and status are required' });
        }

        const normalizedStatus = String(status).trim().toUpperCase();
        if (!['OK', 'ISSUE'].includes(normalizedStatus)) {
            return res.status(400).json({ success: false, error: 'status must be OK or ISSUE' });
        }

        const result = await query(
            `INSERT INTO operations_logs (check_date, status, notes, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING id, check_date, status, notes, created_by, created_at`,
            [date, normalizedStatus, notes || null, req.user?.id || null]
        );

        return res.status(201).json({ success: true, log: result.rows[0] });
    } catch (err) {
        console.error('POST /api/operations/logs error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
