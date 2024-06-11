const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const body = JSON.parse(event.body);
    const prompt = body.prompt;
    const apiKey = process.env.OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/engines/' + model + '/completions', {
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

    const data = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify({ response: data.choices[0].text.trim() })
    };
};
