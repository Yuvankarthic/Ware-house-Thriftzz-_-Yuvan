import Groq from "groq-sdk";
import pool from '../db.js';

const SYSTEM_PROMPT_BASE = `You are an AI stylist and sales assistant for thrift fashion brand "Wearhouse".

Job:
* Help users find products
* Answer business questions (contact, shipping, returns, order process)
* Answer questions about HOW TO ORDER
* Fun, Gen-Z, witty tone
* 1-2 sentences max

BUSINESS INFO:
* Brand: Wearhouse (thrift fashion - affordable, vintage, streetwear)
* Instagram: @wearhouse_thriftxzz
* Phone: +91 75300 39915
* Email: payments.wht@gmail.com
* Shipping: 3-5 days, NO COD available
* Returns: No returns

HOW TO ORDER (always explain when asked):
1. Browse products on website
2. Add to cart
3. Checkout with address
4. Pay via Razorpay (UPI/Card/Netbanking)
5. Order confirmed via email

PRODUCT SEARCH:
When user asks for products, search the database and return products with images.

RULES:
* NEVER say "I don't know" for contact/shipping/returns/order process - use provided info
* NEVER make up products
* If no product found → say "Nothing matching that vibe rn 👀"
* Keep tone friendly, playful, modern
* No long paragraphs
* Focus on helping user buy or explore

START.`;

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
    
    let query = 'SELECT id, name, price, category, image_urls, images FROM products WHERE stock > 0';
    const params = [];
    
    if (priceLimit) {
      params.push(priceLimit);
      query += ` AND price <= $${params.length}`;
    }
    
    if (category) {
      params.push(`%${category}%`);
      query += ` AND category ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC LIMIT 10';
    
    if (params.length === 0) {
      const { rows } = await pool.query(`SELECT id, name, price, category, image_urls, images FROM products WHERE stock > 0 ORDER BY created_at DESC LIMIT 10`);
      return rows;
    }
    
    const { rows } = await pool.query(query, params);
    return rows;
  } catch (e) {
    console.error('Product search error:', e);
    return null;
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

const ORDER_PROCESS_TEXT = `🛒 HOW TO ORDER FROM WEARHOUSE:

1. **Browse** - Visit our shop and find your vibe
2. **Add to Cart** - Click "Add to Cart" on any product
3. **Checkout** - Enter your delivery address
4. **Pay** - Pay securely via Razorpay (UPI/Card/Netbanking)
5. **Done!** - You'll get confirmation via email 📧

⚠️ Note: We don't offer Cash on Delivery. Full payment required.`;

async function lookupOrderDB(message) {
  try {
    const orderIdMatch = message.match(/order\s*#?\s*([a-zA-Z0-9-]+)/i) || message.match(/\b([A-Z0-9]{6,})\b/i);
    if (orderIdMatch && orderIdMatch[1]) {
      const orderId = orderIdMatch[1].trim();
      const { rows } = await pool.query(
        `SELECT id, payment_status, shipping_status, total, created_at, name as product_name, phone FROM orders WHERE id::text = $1 OR payment_id = $1 OR phone = $1 LIMIT 1`, 
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
  if (/(track order|order status|where is my order|my order|check order)/i.test(text)) {
    const orderData = await lookupOrderDB(text);
    if (orderData?.promptUser) {
      return { type: "prompt", message: "Ask user for Order ID or Phone Number" };
    } else if (orderData && !orderData.error) {
      return { 
        type: "order_found",
        message: `📦 Order #${orderData.id}\n\nStatus: ${orderData.shipping_status || orderData.payment_status}\nTotal: ₹${orderData.total}\nDate: ${new Date(orderData.created_at).toLocaleDateString()}`
      };
    } else if (orderData?.error === "not_found") {
      return { type: "not_found", message: "😕 Order not found. Please check your Order ID or registered phone number." };
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

    if (/(how to order|order process|how do i order|procedure to buy|steps to buy|buy.*how)/i.test(text)) {
      return { 
        type: "text", 
        text: ORDER_PROCESS_TEXT,
        quickReply: "Browse Products"
      };
    }

    const orderIntent = await detectOrderIntent(text);
    if (orderIntent) {
      if (orderIntent.type === "prompt") {
        return {
          type: "text",
          text: "Sure! Let's track your order 📦\n\nPlease enter your Order ID or your registered phone number.",
        };
      } else if (orderIntent.type === "order_found" || orderIntent.type === "not_found") {
        return {
          type: "text",
          text: orderIntent.message
        };
      }
    }

    const wantsProducts = /show|give|what.*available|list|products|hoodie|shirt| jacket|jeans|pant|tshirt|sweater|find|looking/i.test(text);
    
    if (wantsProducts) {
      const products = await searchProductsDB(userMessage);
      
      if (products && products.length > 0) {
        const productData = products.slice(0, 6).map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          image: getProductImageUrl(p)
        }));
        
        return {
          type: "products",
          text: `Found ${products.length} items! Tap any to add to cart 👇`,
          products: productData
        };
      } else {
        return {
          type: "text",
          text: "Nothing matching that vibe rn 👀 Try a different style or increase your budget!"
        };
      }
    }

    const products = await searchProductsDB(userMessage);
    
    let productSection = "";
    if (products && products.length > 0) {
      productSection = "\n\n" + products.slice(0, 5).map(p => `${p.name} - ₹${p.price}`).join("\n");
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
      return { type: "text", text: FALLBACK_DB_ERROR };
    }
    
    return { type: "text", text: reply };
  } catch (error) {
    console.error("Groq API Error:", error);
    return { type: "text", text: FALLBACK_AI_ERROR };
  }
}