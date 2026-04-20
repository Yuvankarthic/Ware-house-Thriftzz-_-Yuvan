import express from 'express';

const router = express.Router();

/**
 * POST /api/chatbot
 * Accepts { message, history }
 * Returns mock text
 */
router.post('/', (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message required" });
        }

        // Mock response to satisfy Render tests first without hitting Groq
        res.json({ reply: "I am a basic mock response! Ready for the AI." });
    } catch (error) {
        console.error('Chatbot route error:', error);
        res.status(500).json({ error: "Server error" });
    }
});

// Add a GET method to avoid basic 404s
router.get('/', (req, res) => {
    res.status(400).json({ error: "Cannot GET this path. Use POST to interact with the chatbot." });
});

export default router;