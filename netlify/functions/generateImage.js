const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { dreamText, mood } = JSON.parse(event.body);
        
        // Generer billede
        const imageResponse = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: `A dream-like surreal image: ${dreamText}`,
            n: 1,
            size: "1024x1024",
            model: "dall-e-3",
            quality: "hd",
            style: "vivid"
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Generer analyse med GPT
        const analysisResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "Du er en erfaren drømmetyder og jungiansk psykolog. Analyser drømme med dybde, indsigt og praktisk relevans. Giv analysen på dansk."
            }, {
                role: "user",
                content: `Analysér denne drøm på dansk: "${dreamText}". Stemningen i drømmen var: ${mood}. 
                         Giv en dybdegående analyse med:
                         1. Overordnet betydning
                         2. Centrale symboler og deres betydning
                         3. Personlig relevans og indsigt
                         4. Konkrete handlingsforslag
                         5. Refleksionsspørgsmål`
            }],
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                imageUrl: imageResponse.data.data[0].url,
                analysis: analysisResponse.data.choices[0].message.content
            })
        };
    } catch (error) {
        console.error('Error details:', error.response ? error.response.data : error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to process dream',
                details: error.message,
                openaiError: error.response ? error.response.data : null
            })
        };
    }
};
