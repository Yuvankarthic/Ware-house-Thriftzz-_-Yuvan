import Groq from "groq-sdk";
import pool from '../db.js';

const SYSTEM_PROMPT = `You are 'Alien', a witty AI stylist for a thrift fashion brand called Wearhouse.

Rules:
* Max 2 sentences
* Playful, slightly sarcastic, helpful
* If product data or order data is provided in the prompt -> ALWAYS use it (no hallucination)
* Ask follow-up questions if unclear
* Use max 1 emoji

Goal: Help users discover products, track orders, and convert them into buyers.`;

// Tool 1: Product Search
async function searchProducts(message) {
    try {
        const text = message.toLowerCase();
        const keywords = ['jacket', 'hoodie', 'shirt', 'pant', 'jeans', 'sweater'];
        let matchedKeyword = keywords.find(kw => text.includes(kw));
        
        if (matchedKeyword) {
            const { rows } = await pool.query(
                `SELECT name, price FROM products WHERE stock > 0 AND (name ILIKE $1 OR category ILIKE $1) LIMIT 5`, 
                [`%${matchedKeyword}%`]
            );
            return rows;
        }

        if (/(show products|price|under|cheap|latest)/i.test(text)) {
            const { rows } = await pool.query(`SELECT name, price FROM products WHERE stock > 0 ORDER BY created_at DESC LIMIT 5`);
            return rows;
        }
        return null;
    } catch (e) {
        console.error('Product search error:', e);
        return null;
    }
}

// Tool 2: Order Lookup
async function lookupOrder(message) {
    try {
        const orderIdMatch = message.match(/order\s*#?\s*([a-zA-Z0-9-]+)/i) || message.match(/\b([A-Z0-9]{6,})\b/i);
        if (orderIdMatch && orderIdMatch[1]) {
            const orderId = orderIdMatch[1].trim();
            const { rows } = await pool.query(`SELECT payment_status, shipping_status, created_at FROM orders WHERE id::text = $1 OR payment_id = $1 LIMIT 1`, [orderId]);
            return rows.length > 0 ? rows[0] : { error: "not_found" };
        }
        return { promptUser: true };
    } catch (e) {
        console.error('Order lookup error:', e);
        return null;
    }
}

// Intent Router
async function detectAndExecuteIntent(message) {
    const text = message.toLowerCase();
    
    // Intent: Order status
    if (/(track order|order status|my order|where is my order)/i.test(text)) {
        const orderData = await lookupOrder(message);
        if (orderData?.promptUser) {
            return `[SYSTEM ALERT: The user wants to track an order. Ask them to provide their Order ID or Payment ID.]`;
        } else if (orderData && !orderData.error) {
            return `[SYSTEM ALERT: Order found! Status: ${orderData.shipping_status || orderData.payment_status} placed on ${new Date(orderData.created_at).toLocaleDateString()}. Tell the user.]`;
        } else if (orderData?.error === "not_found") {
            return `[SYSTEM ALERT: We couldn't find an order with that ID in the database. Tell the user it might be incorrect.]`;
        }
    }

    // Intent: Product lookup
    if (/(jacket|hoodie|shirt|pant|jeans|sweater|show products|price|under|cheap|latest)/i.test(text)) {
        const products = await searchProducts(message);
        if (products && products.length > 0) {
            const productLines = products.map(p => `- ${p.name}: ₹${p.price}`).join('\\n');
            return `[SYSTEM ALERT: Found these products in the database exactly matching the user's request. Present them cleanly:\n${productLines}]`;
        } else {
            return `[SYSTEM ALERT: User asked for a product but database returned 0 results. Tell the user we're currently out of stock for that specifically.]`;
        }
    }

    return null;
}

export async function getChatbotResponse(userMessage, history = []) {
    try {
        const formattedHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...formattedHistory
        ];

        // RAG / Tool checking
        const intentResult = await detectAndExecuteIntent(userMessage);

        if (intentResult) {
            messages.push({ role: "system", content: intentResult });
        }

        messages.push({ role: "user", content: userMessage });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
            max_tokens: 150,
        });

        return chatCompletion.choices[0]?.message?.content || "Oops, my fashion brain lagged 😵‍💫 Try again!";
    } catch (error) {
        console.error("Groq API Error:", error.message);
        return "Oops, my fashion brain lagged 😵‍💫 Try again!";
    }
}