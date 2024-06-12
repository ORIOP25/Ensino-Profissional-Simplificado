const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    try {
        const body = JSON.parse(event.body);
        const prompt = body.prompt;
        const model = 'text-davinci-003'; // Certifique-se de usar o modelo correto
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key is not defined' })
            };
        }

        const response = await fetch(`https://api.openai.com/v1/engines/${model}/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify({ response: data.choices[0].text.trim() })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};