// ─────────────────────────────────────────────
//  CMO AI Route  —  /api/ai/cmo
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
import Groq from 'groq-sdk';

const router = Router();

const CMO_SYSTEM_PROMPT = `You are the CMO of a thrift fashion brand.

Job: Give 5 marketing actions.

Output ONLY bullet points starting with •.
One action per line.
Max 1 line per point.
No paragraphs.
No explanations.
No fluff.
Mention specific products, times, or offers.`;

async function fetchMarketingData() {
    const client = await pool.connect();
    try {
        const topSellingRes = await client.query(
            `SELECT product_name, COUNT(*) as orders
             FROM orders
             WHERE created_at > NOW() - INTERVAL '7 days'
             GROUP BY product_name
             ORDER BY orders DESC
             LIMIT 5`
        );

        const unsoldRes = await client.query(
            `SELECT name FROM products WHERE stock > 0 AND id NOT IN (SELECT product_id FROM orders WHERE product_id IS NOT NULL) LIMIT 5`
        );

        const trendRes = await client.query(
            `SELECT DATE(created_at) as date, COUNT(*) as orders
             FROM orders
             WHERE created_at > NOW() - INTERVAL '7 days'
             GROUP BY date
             ORDER BY date DESC
             LIMIT 7`
        );

        return {
            topSelling: topSellingRes.rows.map(r => `${r.product_name} (${r.orders} orders)`),
            unsoldProducts: unsoldRes.rows.map(r => r.name),
            orderTrend: trendRes.rows.map(r => `${r.date}: ${r.orders} orders`),
        };
    } finally {
        client.release();
    }
}

async function getCMOInsight(data) {
    const dataSummary = `Top: ${data.topSelling.join(', ') || 'None'}. Slow: ${data.unsoldProducts.join(', ') || 'None'}. Trend: ${data.orderTrend.join(', ')}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: CMO_SYSTEM_PROMPT },
            { role: 'user', content: `Data: ${dataSummary}. Give 5 bullet points.` },
        ],
        temperature: 0.3,
        max_tokens: 200,
    });

    return chatCompletion.choices[0]?.message?.content || 'Run more campaigns!';
}

router.get('/cmo', async (req, res) => {
    try {
        const data = await fetchMarketingData();
        const insight = await getCMOInsight(data);

        res.json({ success: true, insight });
    } catch (error) {
        console.error('CMO AI Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate insight' });
    }
});

export default router;