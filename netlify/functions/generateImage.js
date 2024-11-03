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
                content: `Du er en erfaren drømmetyder og jungiansk psykolog. 
                Analyser drømme med dybde og indsigt. 
                Dit svar skal altid følge denne HTML-formatering:
                <div class="analysis-section">
                    <h3>Overordnet Betydning</h3>
                    [din analyse her]
                </div>
                <div class="analysis-section">
                    <h3>Centrale Symboler</h3>
                    <ul>
                        [symboler og betydninger som list items]
                    </ul>
                </div>
                <div class="analysis-section">
                    <h3>Personlig Indsigt</h3>
                    [din analyse her]
                </div>
                <div class="analysis-section">
                    <h3>Handlingsforslag</h3>
                    <ul>
                        [forslag som list items]
                    </ul>
                </div>
                <div class="analysis-section">
                    <h3>Refleksionsspørgsmål</h3>
                    <ul>
                        [spørgsmål som list items]
                    </ul>
                </div>`
            }, {
                role: "user",
                content: `Analysér denne drøm på dansk: "${dreamText}". Stemningen i drømmen var: ${mood}.`
            }],
            temperature: 0.7,
            max_tokens: 1500
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
