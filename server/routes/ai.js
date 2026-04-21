import { Router } from 'express';
import pool from '../db.js';
import Groq from 'groq-sdk';
import { authMiddleware, roleMiddleware } from '../auth.js';

const router = Router();

const INSTAGRAM_SYSTEM_PROMPT = `You are a social media strategist for a thrift fashion brand.

Your job:
Generate a full Instagram posting script.

Output format:

Hook:
(short attention grab)

Caption:
(Gen-Z tone, hype, urgency, scarcity)

Story Idea:
(what to post in IG story)

CTA:
(clear action)

Rules:

* Short and punchy
* Use urgency (only 1 piece, rare)
* No long paragraphs
* Sound natural and human`;

const ADMIN_CHAT_SYSTEM_PROMPT = `You are an admin AI assistant for a thrift fashion store.

Your job:
1. Answer questions about orders, products, customers
2. Suggest actions (but NEVER execute - only suggest)

Return JSON with "type" field:
- If question (just need info): {"type": "question", "message": "your answer"}
- If action needed: {"type": "action", "intent": "ACTION_NAME", "data": {}, "message": "description"}

EXAMPLES:
- "what are my recent orders" → {"type": "question", "message": "Getting your recent orders..."}
- "show orders" → {"type": "action", "intent": "GET_ORDERS", "data": {"limit": 10}, "message": "Show 10 recent orders?"}
- "change price of product 5 to 500" → {"type": "action", "intent": "UPDATE_PRICE", "data": {"product_id": 5, "new_price": 500}, "message": "Update price of product #5 to ₹500?"}
- "reduce price of slow items" → {"type": "action", "intent": "DISCOUNT_PRODUCTS", "data": {"percentage": 10}, "message": "Apply 10% discount to slow-moving items?"}
- "how many products do we have" → {"type": "question", "message": "Let me check..."}
- "what is the revenue today" → {"type": "action", "intent": "GENERATE_REPORT", "data": {"type": "daily"}, "message": "Generate today's revenue report?"}

Supported intents:
- ADD_PRODUCT (data: name, price, category, stock)
- UPDATE_PRICE (data: product_id, new_price)
- DISCOUNT_PRODUCTS (data: percentage, limit)
- GET_ORDERS (data: limit)
- GENERATE_REPORT (data: type)

Rules:
- If user asks a question → type: "question", answer directly
- If user asks to DO something → type: "action", describe what you want to do
- Keep messages short and friendly
- If unclear, ask a follow-up question (type: "question")`;

const ALLOWED_INTENTS = new Set([
    'ADD_PRODUCT',
    'UPDATE_PRICE',
    'DISCOUNT_PRODUCTS',
    'GET_ORDERS',
    'GENERATE_REPORT',
    'TRACK_ORDER',
    'ANSWER_ONLY'
]);

const DANGEROUS_PATTERNS = [
    /delete\s+all/i,
    /drop\s+table/i,
    /truncate/i,
    /alter\s+table/i,
    /grant\s+all/i,
    /revoke/i,
    /--/,
    /;\s*drop/i,
    /;\s*delete/i,
    /union\s+select/i,
    /exec\s*\(/i,
    /execute\s*\(/i
];

function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>\"\'%;()&+]/g, '').trim().slice(0, 500);
}

function validateIntent(intent, data) {
    if (intent === 'ANSWER_ONLY') {
        return { valid: true, sanitized: { type: 'question' } };
    }

    if (!intent || !ALLOWED_INTENTS.has(intent)) {
        return { valid: false, error: `Invalid intent: ${intent}` };
    }

    for (const pattern of DANGEROUS_PATTERNS) {
        const dataStr = JSON.stringify(data);
        if (pattern.test(dataStr)) {
            return { valid: false, error: 'Potentially dangerous action detected' };
        }
    }

    switch (intent) {
        case 'ADD_PRODUCT': {
            const name = sanitizeInput(data.name);
            const price = parseInt(data.price);
            if (!name || name.length < 2) return { valid: false, error: 'Invalid product name' };
            if (!price || price < 1 || price > 100000) return { valid: false, error: 'Price must be 1-100000' };
            if (!data.category || data.category.length < 2) return { valid: false, error: 'Invalid category' };
            return { valid: true, sanitized: { name, price, category: sanitizeInput(data.category), stock: Math.min(parseInt(data.stock) || 1, 100), description: sanitizeInput(data.description || ''), images: [] } };
        }

        case 'UPDATE_PRICE': {
            const product_id = parseInt(data.product_id);
            const new_price = parseInt(data.new_price);
            if (!product_id || product_id < 1) return { valid: false, error: 'Invalid product ID' };
            if (!new_price || new_price < 1 || new_price > 100000) return { valid: false, error: 'Price must be 1-100000' };
            return { valid: true, sanitized: { product_id, new_price } };
        }

        case 'DISCOUNT_PRODUCTS': {
            const percentage = Math.min(Math.max(parseInt(data.percentage) || 10, 1), 50);
            const limit = Math.min(parseInt(data.limit) || 5, 5);
            return { valid: true, sanitized: { percentage, limit } };
        }

        case 'GET_ORDERS':
        case 'GENERATE_REPORT': {
            const limit = Math.min(parseInt(data.limit) || 10, 20);
            return { valid: true, sanitized: { limit } };
        }

        case 'TRACK_ORDER': {
            const order_id = sanitizeInput(data.order_id);
            const phone = sanitizeInput(data.phone);
            if (!order_id && !phone) return { valid: false, error: 'Order ID or phone required' };
            return { valid: true, sanitized: { order_id, phone } };
        }

        default:
            return { valid: false, error: 'Unknown intent' };
    }
}

async function generateInstagramScript(product) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const userPrompt = `Product: ${product.name}
Price: ₹${product.price}
Category: ${product.category}
${product.style ? `Style: ${product.style}` : ''}`;

    const chatCompletion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: INSTAGRAM_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
    });

    const content = chatCompletion.choices[0]?.message?.content || '';
    
    const result = {
        hook: '',
        caption: '',
        story: '',
        cta: ''
    };

    const sections = ['Hook:', 'Caption:', 'Story Idea:', 'CTA:'];
    const sectionContent = sections.map((section, i) => {
        const start = content.indexOf(section);
        if (start === -1) return '';
        const end = i < sections.length - 1 ? content.indexOf(sections[i + 1]) : content.length;
        return content.substring(start + section.length, end).trim();
    });

    result.hook = sectionContent[0] || content.split('\n')[0] || '';
    result.caption = sectionContent[1] || '';
    result.story = sectionContent[2] || '';
    result.cta = sectionContent[3] || '';

    return result;
}

async function processAdminChat(message, history = []) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const sanitizedMessage = sanitizeInput(message);
    const formattedHistory = history.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: sanitizeInput(msg.text || msg.message)
    }));

    const chatCompletion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: ADMIN_CHAT_SYSTEM_PROMPT },
            ...formattedHistory,
            { role: 'user', content: sanitizedMessage }
        ],
        temperature: 0.3,
        max_tokens: 300,
    });

    let responseText = chatCompletion.choices[0]?.message?.content || '';
    
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error('Failed to parse AI response:', e);
    }

    return {
        type: 'question',
        message: responseText || 'I\'m not sure how to help with that. Try asking about orders, products, or prices.'
    };
}

router.post('/instagram-script', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const { name, price, category, style } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ 
                success: false, 
                error: 'name, price, and category are required' 
            });
        }

        const sanitizedName = sanitizeInput(name);
        const sanitizedCategory = sanitizeInput(category);
        const sanitizedStyle = sanitizeInput(style || '');
        const sanitizedPrice = parseInt(price);

        if (sanitizedPrice < 1 || sanitizedPrice > 100000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid price range' 
            });
        }

        const script = await generateInstagramScript({ 
            name: sanitizedName, 
            price: sanitizedPrice, 
            category: sanitizedCategory, 
            style: sanitizedStyle 
        });
        
        res.json({ success: true, script });
    } catch (error) {
        console.error('Instagram Script Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to generate script' });
    }
});

router.post('/admin-chat', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'message is required' 
            });
        }

        if (message.length > 500) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message too long (max 500 chars)' 
            });
        }

        const result = await processAdminChat(message, history || []);
        
        res.json({ ...result });
    } catch (error) {
        console.error('Admin Chat Error:', error.message);
        res.status(500).json({ 
            type: 'question',
            message: 'Something went wrong. Please try again.' 
        });
    }
});

router.post('/action', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    const client = await pool.connect();
    const userId = req.user?.id;
    
    try {
        const { intent, data } = req.body;

        if (!intent) {
            return res.status(400).json({ 
                success: false, 
                error: 'intent is required' 
            });
        }

        const validation = validateIntent(intent, data || {});
        if (!validation.valid) {
            await client.query(
                `INSERT INTO system_actions (user_id, intent, data, status, created_at)
                 VALUES ($1, $2, $3, 'rejected', NOW())`,
                [userId, intent, JSON.stringify({ ...data, error: validation.error })]
            );
            return res.status(400).json({ 
                success: false, 
                error: validation.error 
            });
        }

        const sanitized = validation.sanitized;
        let result = null;
        let message = '';

        switch (intent) {
            case 'DISCOUNT_PRODUCTS': {
                const { percentage, limit } = sanitized;
                
                await client.query('BEGIN');
                
                const slowItemsRes = await client.query(
                    `SELECT p.id, p.name, p.price 
                     FROM products p 
                     LEFT JOIN orders o ON p.id = o.product_id 
                     WHERE p.stock > 0 
                     GROUP BY p.id 
                     ORDER BY COALESCE(COUNT(o.id), 0) ASC 
                     LIMIT $1`,
                    [limit]
                );

                if (slowItemsRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.json({ 
                        success: true, 
                        message: 'No products found to discount',
                        affected: 0
                    });
                }

                const productIds = slowItemsRes.rows.map(r => r.id);
                const newPrice = `price * (1 - ${percentage / 100})`;
                
                await client.query(
                    `UPDATE products SET price = ${newPrice}, updated_at = NOW() WHERE id = ANY($1)`,
                    [productIds]
                );

                await client.query(
                    `INSERT INTO system_actions (user_id, intent, data, status, created_at)
                     VALUES ($1, $2, $3, 'completed', NOW())`,
                    [userId, intent, JSON.stringify({ percentage, affected_products: productIds.length })]
                );

                await client.query('COMMIT');
                
                result = slowItemsRes.rows;
                message = `Applied ${percentage}% discount to ${slowItemsRes.rows.length} slow-moving items`;
                break;
            }

            case 'ADD_PRODUCT': {
                const { name, price, category, stock, description, images } = sanitized;
                
                await client.query('BEGIN');
                
                const insertRes = await client.query(
                    `INSERT INTO products (name, price, category, stock, description, images, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                     RETURNING id, name`,
                    [name, price, category, stock, description, images]
                );

                await client.query(
                    `INSERT INTO system_actions (user_id, intent, data, status, created_at)
                     VALUES ($1, $2, $3, 'completed', NOW())`,
                    [userId, intent, JSON.stringify({ product_id: insertRes.rows[0].id, name })]
                );

                await client.query('COMMIT');
                
                result = insertRes.rows[0];
                message = `Added product: ${name}`;
                break;
            }

            case 'UPDATE_PRICE': {
                const { product_id, new_price } = sanitized;
                
                await client.query('BEGIN');
                
                const updateRes = await client.query(
                    `UPDATE products SET price = $1, updated_at = NOW() 
                     WHERE id = $2 RETURNING id, name, price`,
                    [new_price, product_id]
                );

                if (updateRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.json({ 
                        success: true, 
                        message: 'Product not found',
                        affected: 0
                    });
                }

                await client.query(
                    `INSERT INTO system_actions (user_id, intent, data, status, created_at)
                     VALUES ($1, $2, $3, 'completed', NOW())`,
                    [userId, intent, JSON.stringify({ product_id, new_price })]
                );

                await client.query('COMMIT');
                
                result = updateRes.rows[0];
                message = `Updated price for ${updateRes.rows[0].name} to ₹${new_price}`;
                break;
            }

            case 'GET_ORDERS': {
                const { limit } = sanitized;
                
                const ordersRes = await client.query(
                    `SELECT id, payment_status, shipping_status, total, created_at 
                     FROM orders 
                     ORDER BY created_at DESC 
                     LIMIT $1`,
                    [limit]
                );

                await client.query(
                    `INSERT INTO system_actions (user_id, intent, data, status, created_at)
                     VALUES ($1, $2, $3, 'completed', NOW())`,
                    [userId, intent, JSON.stringify({ count: ordersRes.rows.length })]
                );

                result = ordersRes.rows;
                message = `Found ${ordersRes.rows.length} orders`;
                break;
            }

            case 'GENERATE_REPORT': {
                const { limit } = sanitized;
                
                const revenueRes = await client.query(
                    `SELECT COALESCE(SUM(total), 0) as total_revenue, COUNT(*) as total_orders
                     FROM orders WHERE payment_status = 'paid'`
                );

                const topProductsRes = await client.query(
                    `SELECT product_name, COUNT(*) as orders
                     FROM orders
                     GROUP BY product_name
                     ORDER BY orders DESC
                     LIMIT 5`
                );

                const lowStockRes = await client.query(
                    `SELECT name, stock FROM products WHERE stock < 3 AND stock > 0`
                );

                result = {
                    revenue: revenueRes.rows[0],
                    topProducts: topProductsRes.rows,
                    lowStock: lowStockRes.rows
                };

                await client.query(
                    `INSERT INTO system_actions (user_id, intent, data, status, created_at)
                     VALUES ($1, $2, $3, 'completed', NOW())`,
                    [userId, intent, JSON.stringify({ type: 'summary' })]
                );

                message = `Generated summary report`;
                break;
            }

            default:
                return res.status(400).json({ 
                    success: false, 
                    error: `Unknown intent: ${intent}` 
                });
        }

        res.json({ success: true, message, result });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Action Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to execute action' 
        });
    } finally {
        client.release();
    }
});

router.get('/actions', authMiddleware, roleMiddleware('admin', 'staff'), async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        
        const { rows } = await pool.query(
            `SELECT id, user_id, intent, data, status, created_at 
             FROM system_actions 
             ORDER BY created_at DESC 
             LIMIT $1`,
            [limit]
        );

        res.json({ success: true, actions: rows });
    } catch (error) {
        console.error('Get Actions Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch actions' });
    }
});

export default router;