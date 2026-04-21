import express from 'express';
import { getChatbotResponse } from '../services/chatbotService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const recentHistory = Array.isArray(history) ? history.slice(-10) : [];

        const response = await getChatbotResponse(message, recentHistory);

        res.json(response);
    } catch (error) {
        console.error('Chatbot route error:', error);
        res.status(500).json({ type: 'text', text: 'Oops, my fashion brain lagged. Try again in a sec 😅' });
    }
});

router.get('/', (req, res) => {
    res.status(400).json({ error: 'Use POST method to interact with the chatbot.' });
});

export default router;