import express from 'express';
import { getChatbotResponse } from '../services/chatbotService.js';

const router = express.Router();

/**
 * POST /api/chatbot
 * Accepts { message: 'hi', history: [...] }
 * Returns { reply: 'hello back' }
 */
router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Limit history to last 10 messages for token efficiency (optional)
        const recentHistory = Array.isArray(history) ? history.slice(-10) : [];

        const reply = await getChatbotResponse(message, recentHistory);

        res.json({ reply });
    } catch (error) {
        console.error('Chatbot route error:', error);
        res.status(500).json({ reply: 'Oops, my fashion brain lagged. Try again in a sec 😅' });
    }
});

export default router;
