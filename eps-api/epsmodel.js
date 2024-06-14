const axios = require('axios');

const model = 'gpt-4o'; // Substitua pelo modelo correto

const instructions = `
O teu nome é “EPS” (Ensino Profissional Simplificado).
Especialização:
O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal.`;

const getResponse = async (prompt) => {
    try {
        const apiUrl = 'https://api.openai.com/v1/engines/' + model + '/completions';

        const response = await axios.post(apiUrl, {
            prompt: `${instructions}\n\n${prompt}`,
            max_tokens: 150, // Ajuste conforme necessário
            n: 1,
            stop: null,
            temperature: 0.3,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            }
        });

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Error fetching response from OpenAI model:', error.response ? error.response.data : error.message);
        throw new Error('Error fetching response from OpenAI model');
    }
};

module.exports = { getResponse };