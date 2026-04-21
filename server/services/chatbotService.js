import Groq from "groq-sdk";
import pool from '../db.js';

const SYSTEM_PROMPT_BASE = `You are an AI stylist and sales assistant for thrift fashion brand "Wearhouse".

Role:
- Help users find products they love
- Answer business questions (contact, shipping, returns, order process)
- Guide users through ordering
- Fun, Gen-Z, witty tone
- 1-2 sentences max

BUSINESS INFO:
- Brand: Wearhouse (thrift fashion - affordable vintage streetwear)
- Instagram: @wearhouse_thriftxzz  
- Phone: +91 75300 39915
- Email: payments.wht@gmail.com
- Shipping: 3-5 days
- COD: NOT available
- Returns: No returns

HOW TO ORDER:
1. Browse products on website
2. Add to cart
3. Checkout with address
4. Pay via Razorpay (UPI/Card/Netbanking)
5. Order confirmed via email

RULES:
- NEVER say "I don't know" or "let me check" - give direct answers
- NEVER invent products - ONLY use products provided to you
- NEVER say "no products found" - show popular items instead
- Keep tone playful and helpful
- Focus on helping user buy

PRODUCT DISPLAY FORMAT:
When showing products, use format:
"[Product Name] – ₹[Price]"
Example: "Vintage Brown Summer Shirt – ₹599"

START.`;

const FALLBACK_GREETINGS = [
    "Hey! 👋 Welcome to Wearhouse! I'm here to help you find your vibe. What are you looking for?",
    "Hi there! 🛸 Need anything? I can help you find products, track orders, or answer questions!",
    "Yo! 🔥 Let's find you something fresh. What style are you into?"
];

const ORDER_PROCESS_TEXT = `🛒 HOW TO ORDER:

1. Browse our pieces
2. Add to cart  
3. Enter delivery address
4. Pay via Razorpay (UPI/Card/Netbanking)
5. Done! 📧 Confirmation sent

⚠️ No COD available`;

const PRODUCT_CATEGORIES = ['shirt', 'hoodie', 'jeans', 'pant', 'jacket', 'sweater', 'joggers', 'tshirt', 't-shirt', 'coat', 'kurta', 'saree', 'leggings', 'shorts', 'cargo', 'jacket', 'blazer'];

function detectIntent(text) {
    const normalized = text.toLowerCase().trim();
    
    const greetingPatterns = /^(hi|hey|hello|hiya|yo|sup|what's up|hey there|hi there|good morning|good evening|good afternoon|greetings)$/i;
    if (greetingPatterns.test(normalized) || normalized === 'hi' || normalized === 'hey' || normalized === 'hello') {
        return 'greeting';
    }
    
    const productPatterns = /(show|give|what|find|looking|browse|available|list|products?|hoodie|shirt|jacket|jeans|pant|tshirt|sweater|joggers|coat|kurta|saree|leggings|shorts|cargo|blazer|style|vibe|fresh|pieces)/i;
    if (productPatterns.test(normalized)) {
        return 'product_query';
    }
    
    const orderPatterns = /(track|order status|where is my order|my order|check order|order.*id|order.*number|order.*#)/i;
    if (orderPatterns.test(normalized)) {
        return 'order_query';
    }
    
    return 'fallback';
}

function extractSearchTerms(text) {
    const terms = text.toLowerCase();
    const found = [];
    
    PRODUCT_CATEGORIES.forEach(cat => {
        if (terms.includes(cat)) {
            found.push(cat);
        }
    });
    
    if (found.length > 0) {
        return found.join(' ');
    }
    
    const words = terms.split(/\s+/).filter(w => w.length > 2);
    return words.slice(0, 2).join(' ');
}

function extractPriceFilter(text) {
    const priceMatch = text.match(/under\s*(\d+)/i) || text.match(/less than\s*(\d+)/i) || text.match(/below\s*(\d+)/i) || text.match(/(\d+)\s*(rs|rupees)/i);
    if (priceMatch) return parseInt(priceMatch[1], 10);
    
    const budgetMatch = text.match(/budget\s*(\d+)/i);
    if (budgetMatch) return parseInt(budgetMatch[1], 10);
    
    return null;
}

async function searchProductsDB(searchTerm, priceLimit = null) {
    try {
        const searchPattern = `%${searchTerm}%`;
        let query = `
            SELECT id, name, price, category, image_urls, images, chest_length, shoulder_length, size, condition
            FROM products 
            WHERE stock > 0 
              AND (name ILIKE $1 OR category ILIKE $1)
        `;
        const params = [searchPattern];
        
        if (priceLimit) {
            params.push(priceLimit);
            query += ` AND price <= $${params.length}`;
        }
        
        query += ' ORDER BY created_at DESC LIMIT 5';
        
        const { rows } = await pool.query(query, params);
        
        if (rows.length === 0) {
            const fallbackQuery = `
                SELECT id, name, price, category, image_urls, images, chest_length, shoulder_length, size, condition
                FROM products 
                WHERE stock > 0 
                ORDER BY created_at DESC LIMIT 5
            `;
            const fallback = await pool.query(fallbackQuery);
            return { products: fallback.rows, isFallback: true };
        }
        
        return { products: rows, isFallback: false };
    } catch (e) {
        console.error('Product search error:', e);
        return { products: [], isFallback: false };
    }
}

function getProductImageUrl(product) {
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        return product.image_urls[0];
    }
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        return product.images[0];
    }
    return null;
}

function formatProductForLLM(products) {
    return products.map(p => {
        const desc = [];
        if (p.chest_length) desc.push(`Chest: ${p.chest_length}`);
        if (p.shoulder_length) desc.push(`Shoulder: ${p.shoulder_length}`);
        if (p.size) desc.push(`Size: ${p.size}`);
        
        const descStr = desc.length > 0 ? ` (${desc.join(', ')})` : '';
        return `${p.name} – ₹${p.price}${descStr}`;
    }).join('\n');
}

function formatProductDisplay(products) {
    return products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
        size: p.size || null,
        condition: p.condition || null,
        image: getProductImageUrl(p),
        description: p.chest_length || p.shoulder_length ? `Chest: ${p.chest_length || '-'} | Shoulder: ${p.shoulder_length || '-'}` : null
    }));
}

async function searchOrderDB(input) {
    try {
        const trimmed = String(input).trim();
        
        const orderIdMatch = trimmed.match(/^(\d{6,})$/);
        if (orderIdMatch) {
            const orderId = parseInt(orderIdMatch[1], 10);
            const { rows } = await pool.query(
                `SELECT id, product_name, order_status, order_value, created_at, phone 
                 FROM orders WHERE id = $1 LIMIT 1`,
                [orderId]
            );
            if (rows.length > 0) {
                return { found: true, order: rows[0] };
            }
        }
        
        const phoneMatch = trimmed.match(/^(\d{10,})$/);
        if (phoneMatch) {
            const phone = phoneMatch[1];
            const { rows } = await pool.query(
                `SELECT id, product_name, order_status, order_value, created_at, phone 
                 FROM orders WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`,
                [phone]
            );
            if (rows.length > 0) {
                return { found: true, order: rows[0] };
            }
        }
        
        return { found: false };
    } catch (e) {
        console.error('Order search error:', e);
        return { found: false, error: true };
    }
}

function formatOrderStatus(status) {
    const statusEmoji = {
        'New Order': '📦 Received',
        'Accepted': '✅ Accepted',
        'Packing': '📋 Packing',
        'Packed': '📦 Packed',
        'Out for Delivery': '🚚 Out for Delivery',
        'Delivered': '✅ Delivered',
        'Cancelled': '❌ Cancelled'
    };
    return statusEmoji[status] || status;
}

function getRandomGreeting() {
    return FALLBACK_GREETINGS[Math.floor(Math.random() * FALLBACK_GREETINGS.length)];
}

export async function getChatbotResponse(userMessage, history = []) {
    try {
        const text = userMessage.trim();
        const intent = detectIntent(text);
        
        console.log(`[Chatbot] Intent: ${intent}, Message: ${text.substring(0, 50)}`);
        
        if (intent === 'greeting') {
            return {
                type: "text",
                text: getRandomGreeting(),
                quickReply: "Browse Products"
            };
        }
        
        if (intent === 'order_query') {
            const searchValue = text.replace(/^(track|order status|where is my order|my order|check order)\s*/i, '').trim();
            
            if (!searchValue || searchValue.length < 3) {
                return {
                    type: "text",
                    text: "Sure! 📦 Enter your Order ID (like 181001) or your registered phone number to track your order.",
                    promptOrderLookup: true
                };
            }
            
            const result = await searchOrderDB(searchValue);
            
            if (result.found && result.order) {
                const o = result.order;
                return {
                    type: "text",
                    text: `📦 *Order #${o.id}*\n\n*Product:* ${o.product_name}\n*Status:* ${formatOrderStatus(o.order_status)}\n*Total:* ₹${o.order_value}\n*Date:* ${new Date(o.created_at).toLocaleDateString()}`
                };
            } else {
                return {
                    type: "text",
                    text: "😕 Couldn't find that order. Please check your Order ID (like 181001) or your registered phone number and try again."
                };
            }
        }
        
        if (intent === 'product_query') {
            const searchTerms = extractSearchTerms(text);
            const priceLimit = extractPriceFilter(text);
            
            const { products, isFallback } = await searchProductsDB(searchTerms, priceLimit);
            
            if (products && products.length > 0) {
                const productData = formatProductDisplay(products);
                
                const intro = isFallback 
                    ? "Couldn't find exactly what you wanted, but here are some fresh pieces 👇"
                    : `Found ${products.length} pieces! Tap any to add to cart 👇`;
                
                return {
                    type: "products",
                    text: intro,
                    products: productData,
                    isFallback
                };
            }
            
            return {
                type: "text",
                text: "Nothing matching that vibe right now 👀 Try a different style or browse our latest arrivals!",
                quickReply: "Browse Products"
            };
        }
        
        const searchTerm = extractSearchTerms(text);
        if (searchTerm && searchTerm.length > 2) {
            const { products, isFallback } = await searchProductsDB(searchTerm);
            
            if (products && products.length > 0) {
                const productData = formatProductDisplay(products);
                return {
                    type: "products",
                    text: `Found these! 👇`,
                    products: productData,
                    isFallback
                };
            }
        }
        
        const formattedHistory = history.slice(-5).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));
        
        const { products } = await searchProductsDB('');
        const productSection = products && products.length > 0 
            ? '\n\n📦 AVAILABLE PRODUCTS:\n' + formatProductForLLM(products.slice(0, 4))
            : '';
        
        const systemPrompt = `${SYSTEM_PROMPT_BASE}${productSection}`;
        
        const messages = [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
            { role: "user", content: userMessage }
        ];
        
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
            messages: messages,
            temperature: 0.8,
            max_tokens: 150,
        });
        
        const reply = chatCompletion.choices[0]?.message?.content?.trim();
        
        if (!reply) {
            return {
                type: "text",
                text: "Hmm, I'm a bit stuck 😅 Try asking about products or how to order!",
                quickReply: "Browse Products"
            };
        }
        
        return { type: "text", text: reply };
    } catch (error) {
        console.error("Chatbot Error:", error);
        return {
            type: "text",
            text: "Oops! Something glitched 😅 Try again in a sec!"
        };
    }
}