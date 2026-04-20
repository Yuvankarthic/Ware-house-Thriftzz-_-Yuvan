import Groq from "groq-sdk";
import pool from '../db.js';

const SYSTEM_PROMPT_BASE = `You are 'Alien', a witty Gen-Z AI stylist for thrift fashion brand Wearhouse.

Rules:
* ONLY use products provided in "AVAILABLE PRODUCTS" section below
* NEVER invent, change, or guess products/prices
* Keep reply 1-2 sentences max
* Be fun, slightly funny, helpful
* If no products match → say "No products found, try increasing budget or different style"
* Ask follow-up questions if unclear
* Use max 1 emoji

AVAILABLE PRODUCTS:`;

const FALLBACK_DB_ERROR = "No products found, try increasing budget or different style";
const FALLBACK_AI_ERROR = "Oops 👽 something broke, try again!";

const CATEGORIES = ['shirt', 'hoodie', 'jeans', 'pant', 'jacket', 'sweater', 'joggers', 'tshirt', 't-shirt', 'coat', 'kurta'];

function extractPriceFilter(text) {
  const priceMatch = text.match(/under\s*(\d+)/i) || text.match(/less than\s*(\d+)/i) || text.match(/below\s*(\d+)/i) || text.match(/(\d+)\s*rupees/i);
  if (priceMatch) return parseInt(priceMatch[1], 10);
  
  const budgetMatch = text.match(/budget\s*(\d+)/i) || text.match(/(\d+)\s*rs/i);
  if (budgetMatch) return parseInt(budgetMatch[1], 10);
  
  return null;
}

function extractCategory(text) {
  return CATEGORIES.find(cat => text.includes(cat)) || null;
}

async function searchProductsDB(message) {
  try {
    const text = message.toLowerCase();
    const priceLimit = extractPriceFilter(text);
    const category = extractCategory(text);
    
    let query = 'SELECT name, price, category FROM products WHERE stock > 0';
    const params = [];
    
    if (priceLimit) {
      params.push(priceLimit);
      query += ` AND price <= $${params.length}`;
    }
    
    if (category) {
      params.push(`%${category}%`);
      query += ` AND category ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC LIMIT 5';
    
    if (params.length === 0) {
      const { rows } = await pool.query(`SELECT name, price, category FROM products WHERE stock > 0 ORDER BY created_at DESC LIMIT 5`);
      return rows;
    }
    
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (e) {
    console.error('Product search error:', e);
    return null;
  }
}

async function lookupOrderDB(message) {
  try {
    const orderIdMatch = message.match(/order\s*#?\s*([a-zA-Z0-9-]+)/i) || message.match(/\b([A-Z0-9]{6,})\b/i);
    if (orderIdMatch && orderIdMatch[1]) {
      const orderId = orderIdMatch[1].trim();
      const { rows } = await pool.query(
        `SELECT payment_status, shipping_status, created_at FROM orders WHERE id::text = $1 OR payment_id = $1 LIMIT 1`, 
        [orderId]
      );
      return rows.length > 0 ? rows[0] : { error: "not_found" };
    }
    return { promptUser: true };
  } catch (e) {
    console.error('Order lookup error:', e);
    return null;
  }
}

async function detectOrderIntent(text) {
  if (/(track order|order status|my order|where is my order)/i.test(text)) {
    const orderData = await lookupOrderDB(text);
    if (orderData?.promptUser) {
      return "Ask user for Order ID or Payment ID";
    } else if (orderData && !orderData.error) {
      return `Order found! Status: ${orderData.shipping_status || orderData.payment_status} on ${new Date(orderData.created_at).toLocaleDateString()}`;
    } else if (orderData?.error === "not_found") {
      return "Order not found - check ID and try again";
    }
  }
  return null;
}

export async function getChatbotResponse(userMessage, history = []) {
  try {
    const text = userMessage.toLowerCase();
    const formattedHistory = history.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const orderIntent = await detectOrderIntent(text);
    if (orderIntent) {
      const messages = [
        { role: "system", content: SYSTEM_PROMPT_BASE },
        ...formattedHistory,
        { role: "user", content: userMessage }
      ];
      
      if (orderIntent.startsWith("Order found")) {
        messages[0].content += `\n\n[ORDER STATUS: ${orderIntent}]`;
      } else if (orderIntent === "Ask user for Order ID or Payment ID") {
        messages[0].content += `\n\n[SYSTEM: User wants order status. Ask for Order ID or Payment ID]`;
      }
      
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 150,
      });
      
      return chatCompletion.choices[0]?.message?.content || FALLBACK_AI_ERROR;
    }

    const products = await searchProductsDB(userMessage);
    
    let productSection = "";
    if (products && products.length > 0) {
      productSection = "\n\n" + products.map(p => `${p.name} - ₹${p.price}`).join("\n");
    } else {
      productSection = "\n\n(No products available for this search)";
    }

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
      temperature: 0.7,
      max_tokens: 200,
    });

    const reply = chatCompletion.choices[0]?.message?.content?.trim();
    
    if (!reply || products === null) {
      return FALLBACK_DB_ERROR;
    }
    
    return reply;
  } catch (error) {
    console.error("Groq API Error:", error);
    return FALLBACK_AI_ERROR;
  }
}