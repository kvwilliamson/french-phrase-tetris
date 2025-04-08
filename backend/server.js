const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint to validate a phrase
app.post('/validate-phrase', async (req, res) => {
    const { phrase } = req.body;

    if (!phrase) {
        return res.status(400).json({ error: 'Phrase is required' });
    }

    try {
        // Replace with your LLM API (e.g., Hugging Face, OpenAI)
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/grammarly/french-grammar-checker', // Example endpoint
            { inputs: phrase },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LLM_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Assuming the LLM returns { isValid: true/false }
        const isValid = response.data.isValid || false;
        res.json({ isValid });
    } catch (error) {
        console.error('Error calling LLM API:', error.message);
        res.status(500).json({ error: 'Failed to validate phrase' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});