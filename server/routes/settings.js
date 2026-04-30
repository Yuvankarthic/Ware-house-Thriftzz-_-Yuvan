import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();

let settingsReady = false;
const ensureSettingsTable = async () => {
    if (settingsReady) return;
    await pool.query(`        CREATE TABLE IF NOT EXISTS site_settings (
            key VARCHAR(50) PRIMARY KEY,
            value JSONB NOT NULL
        );`);
    await pool.query(`INSERT INTO site_settings (key, value) VALUES ('show_pants', 'false'::jsonb) ON CONFLICT (key) DO NOTHING`);
    settingsReady = true;
};

router.get('/', async (req, res) => {
    try {
        await ensureSettingsTable();
        const result = await pool.query('SELECT key, value FROM site_settings');
        const settings = result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
        res.json({ success: true, settings });
    } catch (err) {
        console.error('GET /api/settings error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/', authMiddleware, async (req, res) => {
    try {
        const { key, value } = req.body;
        await ensureSettingsTable();
        await pool.query(
            'INSERT INTO site_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb',
            [key, JSON.stringify(value)]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /api/settings error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;