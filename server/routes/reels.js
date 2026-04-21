import { Router } from 'express';
import pool from '../db.js';
import Groq from 'groq-sdk';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router = Router();

const FALLBACK_IDEAS = {
    trendingTopics: ['Thrift Flip', 'Outfit of the Day', 'GRWM', 'Sustainable Fashion', 'Budget Style'],
    reelIdeas: [
        {
            title: 'Thrift Flip Challenge',
            concept: 'Transform boring thrift finds into fire outfits',
            hook: 'This ₹500 find looks like ₹5000! 🔥',
            script: 'Found this at local thrift store. Let me show you how to style it.',
            hashtags: ['#thriftflip', '#sustainablefashion', '#streetwear', '#fyp'],
            audio: 'Trending hip-hop beat'
        },
        {
            title: 'GRWM Thrift Haul',
            concept: 'Get ready with me using only thrift finds',
            hook: 'Getting ready for the weekend with THRIFT only 💅',
            script: 'Starting with this jacket, adding these pants...',
            hashtags: ['#grwm', '#thriftfinds', '#budgetstyle'],
            audio: 'Viral pop song'
        },
        {
            title: 'Before & After',
            concept: 'Show the transformation of thrifted pieces',
            hook: 'Wait for the after 👀',
            script: 'Found this at ₹300. Here is what ₹3000 looks like.',
            hashtags: ['#transformation', '#thrifted', '#styleinspo'],
            audio: 'Dramatic reveal sound'
        },
        {
            title: 'What I wore this week - All Thrifted',
            concept: 'Weekly outfit recap from thrift stores',
            hook: 'Full week of fits, all under ₹2000 😱',
            script: 'Monday: streetwear look, Tuesday: formal vibe...',
            hashtags: ['#outfitoftheday', '#thriftstore', '#wastefree'],
            audio: 'Chill lo-fi beat'
        },
        {
            title: 'Thrift Store Near Me Tour',
            concept: 'Tour local thrift stores and show best finds',
            hook: 'This store has UNREAL hidden gems 🤯',
            script: 'Walking through the racks... OMG look at this!',
            hashtags: ['#thriftstoredate', '#thriftusa', '#secondhand'],
            audio: 'Upbeat energetic track'
        }
    ],
    bestPractices: [
        'Use trending audio - check Instagram Reels audio page',
        'Add text captions - many watch on mute',
        'Hook in first 3 seconds',
        'Post at peak times (7-9 PM)',
        'Use relevant hashtags',
        'End with CTA (Comment, Share, Save)'
    ],
    postingSchedule: 'Best times: 7-9 AM, 12-2 PM, 7-9 PM'
};

async function analyzeProductsForReels() {
    if (!process.env.GROQ_API_KEY) {
        console.warn('GROQ_API_KEY not set, using fallback ideas');
        return FALLBACK_IDEAS;
    }

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
${productsSummary || 'No products in stock'}

TOP SELLING THIS MONTH:
${topProductsSummary || 'No sales data'}

WEEKLY ORDERS: ${data.weeklyOrders}

Generate creative Reels content ideas for this thrift store. Focus on:
1. Viral thrift fashion angles
2. Budget vs luxury comparisons
3. Sustainable fashion messaging
4. Urgency/scarcity (only 1 piece!)
5. Transformation content
`;

        const chatCompletion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a social media expert. Generate JSON only, no other text.' },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 1500,
        });

        let content = chatCompletion.choices[0]?.message?.content || '';
        
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.trendingTopics || parsed.reelIdeas) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to parse reels ideas:', e);
        }

        return FALLBACK_IDEAS;
    } catch (error) {
        console.error('Reels generation error:', error.message);
        return FALLBACK_IDEAS;
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
        res.json({ 
            success: true, 
            ideas: FALLBACK_IDEAS,
            note: 'Using default ideas due to error'
        });
    }
});

export default router;