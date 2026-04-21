import { Router } from 'express';
import pool from '../db.js';
import Groq from 'groq-sdk';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router = Router();

const REELS_SYSTEM_PROMPT = `You are a social media content strategist specializing in viral Instagram Reels for thrift fashion brands.

Your job:
Analyze the product data and generate creative Reels content ideas that can go viral.

Output format (JSON):

{
"trendingTopics": ["topic1", "topic2", "topic3"],
"reelIdeas": [
{
"title": "short catchy title",
"concept": "what the reel is about",
"hook": "first 3 seconds",
"script": "main script/talking points",
"hashtags": ["#hashtag1", "#hashtag2"],
"audio": "suggested audio/trend"
},
...more ideas
],
"bestPractices": ["tip1", "tip2"],
"postingSchedule": "best times to post"
}

Rules:
* Focus on Gen-Z trends (thrift flip, flip challenge, OOTD, GRWM, etc.)
* Keep ideas short and punchy
* Include trending audio suggestions
* Make it actionable and filmable`;

async function analyzeProductsForReels() {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const client = await pool.connect();
    try {
        const productsRes = await client.query(
            `SELECT name, price, category, description, stock 
             FROM products 
             WHERE stock > 0 
             ORDER BY created_at DESC 
             LIMIT 20`
        );

        const ordersRes = await client.query(
            `SELECT product_name, COUNT(*) as orders
             FROM orders
             WHERE created_at > NOW() - INTERVAL '30 days'
             GROUP BY product_name
             ORDER BY orders DESC
             LIMIT 10`
        );

        const recentOrdersCount = await client.query(
            `SELECT COUNT(*) as count FROM orders WHERE created_at > NOW() - INTERVAL '7 days'`
        );

        const data = {
            products: productsRes.rows,
            topSelling: ordersRes.rows,
            weeklyOrders: recentOrdersCount.rows[0]?.count || 0
        };

        const productsSummary = data.products.map(p => 
            `${p.name} (₹${p.price}, ${p.category})`
        ).join('\n');

        const topProductsSummary = data.topSelling.map(p => 
            `${p.product_name} (${p.orders} sales)`
        ).join('\n');

        const userPrompt = `
PRODUCTS AVAILABLE:
${productsSummary}

TOP SELLING THIS MONTH:
${topProductsSummary}

WEEKLY ORDERS: ${data.weeklyOrders}

Generate creative Reels content ideas based on this data. Focus on:
1. What products would make viral content
2. Trending thrift fashion angles
3. Behind the scenes content ideas
4. Customer testimonials/UGC ideas
5. Urgency/scarcity content
`;

        const chatCompletion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: REELS_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 1500,
        });

        let content = chatCompletion.choices[0]?.message?.content || '';
        
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse reels ideas:', e);
        }

        return {
            trendingTopics: ['Thrift Flip', 'Outfit of the Day', 'GRWM', 'Sustainable Fashion'],
            reelIdeas: [
                {
                    title: 'Thrifting 101',
                    concept: 'Show how to find gems in thrift stores',
                    hook: 'Stop throwing money at expensive brands!',
                    script: 'This hoodie was only ₹999 originally ₹3000',
                    hashtags: ['#thriftflip', '#sustainablefashion', '#streetwear'],
                    audio: 'Trending viral sound'
                }
            ],
            bestPractices: ['Use trending audio', 'Add captions', 'Post at peak times'],
            postingSchedule: '7-9 PM weekdays, 12-2 PM weekends'
        };
    } finally {
        client.release();
    }
}

router.post('/reels-ideas', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const ideas = await analyzeProductsForReels();
        res.json({ success: true, ideas });
    } catch (error) {
        console.error('Reels Ideas Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate ideas' });
    }
});

export default router;