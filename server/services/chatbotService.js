import Groq from "groq-sdk";

// Initialize the Groq SDK with the API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompt defining the persona
const SYSTEM_PROMPT = `You are Alien, a witty, friendly Gen-Z AI assistant for a thrift and streetwear fashion store called Wearhouse (WHT Fashion). 
Keep your replies short, punchy (1-3 sentences max), playful, and genuinely helpful. 
Use light humor and use emojis sparingly. 
You can answer basic product questions, give styling suggestions, and provide basic order help. 
If you don't know the answer to an order tracking or specific database question gracefully guide the user to browse the site or contact human support. 
NEVER be rude, offensive, or unsafe. Keep the vibe cool but professional.`;

/**
 * Send a message to Groq's API and get a response.
 * @param {string} userMessage - The new message from the user
 * @param {Array} history - Array of previous messages [{role: 'user'|'assistant', content: '...'}]
 * @returns {Promise<string>} - The AI's text response
 */
export async function getChatbotResponse(userMessage, history = []) {
    try {
        // Map frontend history format to Groq role format if needed
        const formattedHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...formattedHistory,
            { role: "user", content: userMessage }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama3-8b-8192",
            temperature: 0.7,
            max_tokens: 150,
        });

        return chatCompletion.choices[0]?.message?.content || "Oops, my fashion brain lagged. Try again in a sec 😅";
    } catch (error) {
        console.error("Groq API Error:", error.message);
        throw new Error("Failed to get chatbot response");
    }
}
