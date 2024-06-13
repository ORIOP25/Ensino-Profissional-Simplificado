const axios = require('axios');

 // Substitua pelo seu token de API da OpenAI
const model = 'gpt-3.5'; // Substitua pelo modelo correto

const instructions = `
O teu nome é “EPS” (Ensino Profissional Simplificado).
Especialização:
O chatbot é especializado no ensino profissional do 10º ao 12º ano em Portugal.
Escopo:
O chatbot deve responder apenas sobre escolas específicas que foram indicadas. Não mencione escolas que não estejam nas instruções.
Formato das Respostas:
Sempre que listar escolas, use o nome completo de cada instituição.
Organize as respostas em formato de lista com parágrafos para maior legibilidade.
`;

const getResponse = async (prompt) => {
    try {
        const apiUrl = 'https://api.openai.com/v1/engines/' + model + '/completions';

        const response = await axios.post(apiUrl, {
            prompt: `${instructions}\n\n${prompt}`,
            max_tokens: 10, // Ajuste conforme necessário
            n: 1,
            stop: null,
            temperature: 0.7,
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