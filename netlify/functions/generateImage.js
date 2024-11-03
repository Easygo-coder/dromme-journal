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
        console.log('Processing request for dream:', dreamText.substring(0, 50) + '...');

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OpenAI API Key');
        }

        // Kør begge API kald parallelt
        const [imageResponse, analysisResponse] = await Promise.all([
            // Billede generation
            axios.post('https://api.openai.com/v1/images/generations', {
                prompt: `A ${imageStyle || 'realistic'} artistic interpretation of this dream scene: ${dreamText}. High quality, detailed, atmospheric.`,
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
            }),

            // Analyse generation
            axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4-1106-preview",
                messages: [{
                    role: "system",
                    content: `Du er en erfaren drømmetyder. Giv korte, præcise analyser på dansk.`
                }, {
                    role: "user",
                    content: `Analysér denne drøm kort og præcist:
                    
                    Drøm: "${dreamText}"
                    Stemning: ${mood}
                    
                    Format din analyse sådan:
                    <div class="analysis-section">
                        <h3>Overordnet Betydning</h3>
                        [kort analyse, max 2 sætninger]
                    </div>
                    <div class="analysis-section">
                        <h3>Centrale Symboler</h3>
                        <ul>
                            <li>[vigtigste symbol]</li>
                            <li>[næstvigtigste symbol]</li>
                        </ul>
                    </div>
                    <div class="analysis-section">
                        <h3>Personlig Indsigt</h3>
                        [kort indsigt, max 2 sætninger]
                    </div>`
                }],
                temperature: 0.7,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        console.log('Processing complete');

        return {
            statusCode: 200,
            body: JSON.stringify({
                imageUrl: imageResponse.data.data[0].url,
                analysis: analysisResponse.data.choices[0].message.content
            })
        };

    } catch (error) {
        console.error('Error details:', error.message);
        console.error('Full error:', error);
        
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
