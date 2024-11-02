const axios = require('axios');

async function analyzeDreamWithGPT(dreamText, mood) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "Du er en erfaren drømmetyder og jungiansk psykolog. Analyser drømme med dybde, indsigt og praktisk relevans. Inkluder både symbolsk betydning, personlig relevans og konkrete handlingsforslag."
            }, {
                role: "user",
                content: `Analysér denne drøm: "${dreamText}". Stemningen i drømmen var: ${mood}. 
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

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('GPT Analysis error:', error);
        return "Kunne ikke generere analyse. Prøv igen.";
    }
}

async function generateDreamImage(dreamText) {
    const prompt = `Create a highly detailed, surreal interpretation of this dream scene: "${dreamText}". 
    Make it photorealistic yet dreamlike, with soft ethereal lighting.
    Use a sophisticated color palette with deep shadows and highlights.
    Include intricate details and symbolic elements.
    Style it as a professional fine art photograph or digital painting with dramatic composition.
    The scene should be clear and focused, not abstract, maintaining the specific elements from the dream.`;

    const response = await axios.post('https://api.openai.com/v1/images/generations', {
        prompt: prompt,
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

    return response.data.data[0].url;
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { dreamText, mood } = JSON.parse(event.body);
        
        // Kør analyse og billedgenerering parallelt
        const [analysis, imageUrl] = await Promise.all([
            analyzeDreamWithGPT(dreamText, mood),
            generateDreamImage(dreamText)
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({
                analysis: analysis,
                imageUrl: imageUrl
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to process dream',
                details: error.message
            })
        };
    }
};
