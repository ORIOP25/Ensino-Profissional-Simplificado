const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../static')));

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

const openaiApiKey = process.env.OPENAI_API_KEY;
const model = 'gpt-4o';

const instructions = `
O teu nome é “EPS” (Ensino Profissional Simplificado).
`;

const getResponse = async (prompt) => {
    try {
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        console.log('Sending request to OpenAI API...');
        const response = await axios.post(apiUrl, {
            model: model,
            messages: [{
                role: "system",
                content: instructions
            }, {
                role: "user",
                content: prompt
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            }
        });

        console.log('Received response from OpenAI API:', response.data);
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error fetching response from OpenAI model:', error.response ? error.response.data : error.message);
        throw new Error('Error fetching response from OpenAI model');
    }
};

app.post('/eps', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        console.log('Received prompt:', prompt);
        const response = await getResponse(prompt);
        console.log('Sending response:', response);
        res.json({ response });
    } catch (error) {
        console.error('Error in /eps endpoint:', error.message);
        res.status(500).json({ error: 'Failed to get response from EPS model' });
    }
});

app.get('/', (req, res) => {
    console.log('Serving index.html');
    res.sendFile(path.join(__dirname, '../static', 'index.html'));
});

app.listen(port, () => {
    console.log(`EPS API server running at http://localhost:${port}`);
});