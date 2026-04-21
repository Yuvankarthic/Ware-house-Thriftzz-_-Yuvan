import express from 'express';
import { getChatbotResponse } from '../services/chatbotService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const trimmedMessage = message.trim().substring(0, 500);
        const recentHistory = Array.isArray(history) ? history.slice(-10) : [];

        console.log(`[Chatbot] Processing: "${trimmedMessage.substring(0, 50)}"`);

        const response = await getChatbotResponse(trimmedMessage, recentHistory);

        res.json(response);
    } catch (error) {
        console.error('[Chatbot] Route error:', error);
        res.status(500).json({ 
            type: 'text', 
            text: 'Oops! Something glitched 😅 Try again in a sec!' 
        });
    }
});

router.get('/', (req, res) => {
    res.status(400).json({ error: 'Use POST method to interact with the chatbot.' });
});

export default router;