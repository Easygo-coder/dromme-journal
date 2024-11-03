const axios = require('axios');

exports.handler = async function(event, context) {
    console.log('Function started');
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        console.log('Request body:', body);
        
        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key is missing');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key configuration is missing' })
            };
        }

        const { dreamText, mood, imageStyle } = body;
        if (!dreamText) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Dream text is required' })
            };
        }

        // Generer billede
        console.log('Generating image...');
        const imagePrompt = `A ${imageStyle || 'surreal'} artistic interpretation of this dream scene: ${dreamText}. Make it detailed, atmospheric, and emotionally resonant with the mood: ${mood}.`;
        
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

        // Generer analyse med GPT
        console.log('Generating analysis...');
        const analysisResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{
                role: "system",
                content: `Du er en erfaren drømmetyder og jungiansk psykolog. Analyser drømme med dybde og indsigt. Format din analyse i HTML sektioner.`
            }, {
                role: "user",
                content: `Analysér denne drøm på dansk og formater svaret præcist med denne HTML struktur:
                <div class="analysis-section">
                    <h3>Overordnet Betydning</h3>
                    [Skriv en overordnet analyse af drømmens betydning her]
                </div>
                <div class="analysis-section">
                    <h3>Centrale Symboler</h3>
                    <ul>
                        <li>[Symbol 1 og dets betydning]</li>
                        <li>[Symbol 2 og dets betydning]</li>
                        [Fortsæt med flere symboler hvis relevant]
                    </ul>
                </div>
                <div class="analysis-section">
                    <h3>Personlig Indsigt</h3>
                    [Skriv personlige indsigter og refleksioner her]
                </div>
                <div class="analysis-section">
                    <h3>Handlingsforslag</h3>
                    <ul>
                        <li>[Konkret forslag 1]</li>
                        <li>[Konkret forslag 2]</li>
                        [Tilføj flere forslag hvis relevant]
                    </ul>
                </div>
                <div class="analysis-section">
                    <h3>Refleksionsspørgsmål</h3>
                    <ul>
                        <li>[Spørgsmål 1]</li>
                        <li>[Spørgsmål 2]</li>
                        [Tilføj flere spørgsmål hvis relevant]
                    </ul>
                </div>

                Drømmetekst: "${dreamText}"
                Stemning: ${mood}`
            }],
            temperature: 0.7,
            max_tokens: 1500
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Processing complete, preparing response');

        const analysis = analysisResponse.data.choices[0]?.message?.content;
        if (!analysis) {
            throw new Error('No analysis content received from GPT');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageUrl: imageResponse.data.data[0].url,
                analysis: analysis
            })
        };

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to process dream',
                details: error.message,
                openaiError: error.response?.data || 'No response data'
            })
        };
    }
};
