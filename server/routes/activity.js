import { Router } from 'express';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
const query = (text, params) => pool.query(text, params);

let tablesReady = false;

const ensureActivityTables = async () => {
    if (tablesReady) return;

    await query(`
        CREATE TABLE IF NOT EXISTS visit_logs (
            id          BIGSERIAL PRIMARY KEY,
            page        VARCHAR(120) NOT NULL DEFAULT 'homepage',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS activity_events (
            id          BIGSERIAL PRIMARY KEY,
            event_type  VARCHAR(80) NOT NULL,
            product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
            page        VARCHAR(120),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    tablesReady = true;
};

const toDateOnly = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

router.post('/track-visit', async (req, res) => {
    try {
        await ensureActivityTables();

        const page = String(req.body?.page || 'homepage').trim().slice(0, 120) || 'homepage';
        const dateOnly = toDateOnly(req.body?.timestamp);

        if (dateOnly) {
            await query(
                `INSERT INTO visit_logs (page, created_at) VALUES ($1, $2::date + CURRENT_TIME)`,
                [page, dateOnly]
            );
            await query(
                `INSERT INTO activity_events (event_type, page, created_at)
                 VALUES ('page_visit', $1, $2::date + CURRENT_TIME)`,
                [page, dateOnly]
            );
        } else {
            await query(`INSERT INTO visit_logs (page) VALUES ($1)`, [page]);
            await query(`INSERT INTO activity_events (event_type, page) VALUES ('page_visit', $1)`, [page]);
        }

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error('❌ POST /track-visit error:', err);
        // Tracking must never break UX; accept request even if persistence fails.
        return res.status(202).json({ success: false, queued: false });
    }
});

router.post('/track-event', async (req, res) => {
    try {
        await ensureActivityTables();

        const eventType = String(req.body?.event || '').trim().toLowerCase();
        const parsedProductId = Number.parseInt(String(req.body?.product_id || ''), 10);
        const productId = Number.isInteger(parsedProductId) ? parsedProductId : null;
        const page = req.body?.page ? String(req.body.page).trim().slice(0, 120) : null;
        const dateOnly = toDateOnly(req.body?.timestamp);

        if (!eventType) {
            return res.status(400).json({ success: false, error: 'event is required' });
        }

        if (dateOnly) {
            await query(
                `INSERT INTO activity_events (event_type, product_id, page, created_at)
                 VALUES ($1, $2, $3, $4::date + CURRENT_TIME)`,
                [eventType, productId, page, dateOnly]
            );
        } else {
            await query(
                `INSERT INTO activity_events (event_type, product_id, page)
                 VALUES ($1, $2, $3)`,
                [eventType, productId, page]
            );
        }

        return res.status(201).json({ success: true });
    } catch (err) {
        console.error('❌ POST /track-event error:', err);
        // Tracking must never break UX; accept request even if persistence fails.
        return res.status(202).json({ success: false, queued: false });
    }
});

router.get('/activity-summary', authMiddleware, async (_req, res) => {
    try {
        await ensureActivityTables();

        const today = new Date().toISOString().split('T')[0];

        const [visitorsTodayRes, totalVisitsRes, ordersTodayRes] = await Promise.all([
            query(`SELECT COUNT(*)::int AS count FROM visit_logs WHERE DATE(created_at) = $1`, [today]),
            query(`SELECT COUNT(*)::int AS count FROM visit_logs`),
            query(`SELECT COUNT(*)::int AS count FROM orders WHERE DATE(created_at) = $1`, [today]),
        ]);

        const visitorsToday = visitorsTodayRes.rows[0]?.count || 0;
        const totalVisits = totalVisitsRes.rows[0]?.count || 0;
        const ordersToday = ordersTodayRes.rows[0]?.count || 0;
        const conversionRate = visitorsToday > 0
            ? Number(((ordersToday / visitorsToday) * 100).toFixed(1))
            : 0;

        return res.json({
            success: true,
            summary: {
                visitors_today: visitorsToday,
                total_visits: totalVisits,
                orders_today: ordersToday,
                conversion_rate: conversionRate,
            },
        });
    } catch (err) {
        console.error('❌ GET /activity-summary error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.get('/activity-logs', authMiddleware, async (req, res) => {
    try {
        await ensureActivityTables();

        const parsedLimit = Number.parseInt(String(req.query.limit || '100'), 10);
        const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 100;

        const result = await query(
            `SELECT id, event_type, product_id, page, created_at
             FROM activity_events
             ORDER BY created_at DESC
             LIMIT $1`,
            [limit]
        );

        return res.json({ success: true, logs: result.rows });
    } catch (err) {
        console.error('❌ GET /activity-logs error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
