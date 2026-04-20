// ─────────────────────────────────────────────
//  CEO AI Route  —  /api/ai/ceo
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
import Groq from 'groq-sdk';

const router = Router();

const CEO_SYSTEM_PROMPT = `You are the CEO of a thrift fashion brand.

Job: Give 4 clear action points.

Output ONLY bullet points starting with •.
One action per line.
Max 1 line per point.
No paragraphs.
No explanations.
No fluff.`;

async function fetchDailyMetrics() {
    const client = await pool.connect();
    try {
        const ordersRes = await client.query(
            `SELECT COUNT(*) as orders_today FROM orders WHERE DATE(created_at) = CURRENT_DATE`
        );
        const revenueRes = await client.query(
            `SELECT COALESCE(SUM(order_value), 0) as revenue_today FROM orders WHERE DATE(created_at) = CURRENT_DATE`
        );
        const productsRes = await client.query(
            `SELECT COUNT(*) as products_added FROM products WHERE DATE(created_at) = CURRENT_DATE`
        );
        const unsoldRes = await client.query(
            `SELECT COUNT(*) as unsold_products FROM products WHERE stock > 0`
        );

        return {
            ordersToday: parseInt(ordersRes.rows[0]?.orders_today || 0, 10),
            revenueToday: parseInt(revenueRes.rows[0]?.revenue_today || 0, 10),
            productsAdded: parseInt(productsRes.rows[0]?.products_added || 0, 10),
            unsoldProducts: parseInt(unsoldRes.rows[0]?.unsold_products || 0, 10),
        };
    } finally {
        client.release();
    }
}

async function getCEOInsight(metrics) {
    const dataSummary = `Orders: ${metrics.ordersToday}, Revenue: ₹${metrics.revenueToday}, Products added: ${metrics.productsAdded}, Unsold: ${metrics.unsoldProducts}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: CEO_SYSTEM_PROMPT },
            { role: 'user', content: `Data: ${dataSummary}. Give 4 bullet points.` },
        ],
        temperature: 0.3,
        max_tokens: 150,
    });

    return chatCompletion.choices[0]?.message?.content || 'Push harder today!';
}

router.get('/ceo', async (req, res) => {
    try {
        const metrics = await fetchDailyMetrics();
        const insight = await getCEOInsight(metrics);

        res.json({ success: true, insight });
    } catch (error) {
        console.error('CEO AI Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate insight' });
    }
});

export default router;