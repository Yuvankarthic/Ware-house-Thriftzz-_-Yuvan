// ─────────────────────────────────────────────
//  CFO AI Route  —  /api/ai/cfo
// ─────────────────────────────────────────────
import { Router } from 'express';
import pool from '../db.js';
import Groq from 'groq-sdk';

const router = Router();

const CFO_SYSTEM_PROMPT = `You are the CFO of a thrift fashion brand.

Your job:
- Improve revenue
- Optimize pricing
- Reduce losses

Rules:
- Be direct
- Suggest pricing changes
- Suggest bundles or upsells
- Focus on profit
- Give 3-5 clear actions
- Use bullet points
- Think numbers`;

async function fetchFinancialData() {
    const client = await pool.connect();
    try {
        const todayRevenueRes = await client.query(
            `SELECT COALESCE(SUM(order_value), 0) as revenue_today FROM orders WHERE DATE(created_at) = CURRENT_DATE`
        );

        const avgOrderRes = await client.query(
            `SELECT AVG(order_value) as avg_order FROM orders`
        );

        const topRevenueRes = await client.query(
            `SELECT product_name, SUM(order_value) as revenue
             FROM orders
             WHERE product_name IS NOT NULL
             GROUP BY product_name
             ORDER BY revenue DESC
             LIMIT 5`
        );

        const deadStockRes = await client.query(
            `SELECT name FROM products WHERE id NOT IN (SELECT COALESCE(product_id, -1) FROM orders WHERE product_id IS NOT NULL) AND stock > 0 LIMIT 5`
        );

        return {
            revenueToday: parseInt(todayRevenueRes.rows[0]?.revenue_today || 0, 10),
            avgOrder: parseInt(avgOrderRes.rows[0]?.avg_order || 0, 10),
            topRevenueProducts: topRevenueRes.rows.map(r => `${r.product_name}: ₹${r.revenue}`),
            deadStock: deadStockRes.rows.map(r => r.name),
        };
    } finally {
        client.release();
    }
}

async function getCFOInsight(data) {
    const dataSummary = `
Revenue today: ₹${data.revenueToday}
Average order: ₹${data.avgOrder}
Top revenue products: ${data.topRevenueProducts.join(', ') || 'None'}
Dead stock: ${data.deadStock.join(', ') || 'None'}
`.trim();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: CFO_SYSTEM_PROMPT },
            { role: 'user', content: dataSummary },
        ],
        temperature: 0.7,
        max_tokens: 250,
    });

    return chatCompletion.choices[0]?.message?.content || 'Optimize for profit!';
}

router.get('/cfo', async (req, res) => {
    try {
        const data = await fetchFinancialData();
        const insight = await getCFOInsight(data);

        res.json({ success: true, insight });
    } catch (error) {
        console.error('CFO AI Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate insight' });
    }
});

export default router;