const axios = require('axios');

exports.handler = async function(event, context) {
    console.log('Function started');
    
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { dreamText, mood, imageStyle } = JSON.parse(event.body);
        console.log('Received request:', { dreamText, mood, imageStyle });

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OpenAI API Key');
        }

        // Generer billede
        const imagePrompt = `A ${imageStyle || 'realistic'} artistic interpretation of this dream scene: ${dreamText}. High quality, detailed, atmospheric.`;
        console.log('Generating image with prompt:', imagePrompt);
        
        const imageResponse = await axios.post('https://api.openai.com/v1/images/generations', {
            prompt: imagePrompt,
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

        // Generer analyse
        const analysisResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "system",
                content: `Du er en erfaren drømmetyder. Analyser drømme på dansk og giv indsigtsfuld feedback.`
            }, {
                role: "user",
                content: `Analysér denne drøm og giv svaret i dette HTML format:
                <div class="analysis-section">
                    <h3>Overordnet Betydning</h3>
                    [din analyse her]
                </div>
                <div class="analysis-section">
                    <h3>Centrale Symboler</h3>
                    <ul>
                        <li>[symbol og betydning]</li>
                    </ul>
                </div>
                <div class="analysis-section">
                    <h3>Personlig Indsigt</h3>
                    [din indsigt her]
                </div>

                Drøm: "${dreamText}"
                Stemning: ${mood}`
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
        console.error('Error:', error);
        console.error('Error response:', error.response?.data);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Processing failed',
                details: error.message,
                apiError: error.response?.data
            })
        };
    }
};
