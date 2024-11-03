const axios = require('axios');

function getImagePrompt(dreamText, style) {
    const stylePrompts = {
        surreal: `A surreal, dreamlike interpretation: ${dreamText}. Style: Surrealist art like Salvador Dali, with floating elements and impossible perspectives. Ethereal lighting and dreamy atmosphere.`,
        
        painting: `An oil painting interpretation of this dream: ${dreamText}. Style: Classical oil painting technique with rich textures and dramatic lighting, in the style of the old masters.`,
        
        digital: `A modern digital art interpretation: ${dreamText}. Style: High-quality digital art with vivid colors and modern design elements, sleek and polished finish.`,
        
        watercolor: `A soft watercolor interpretation: ${dreamText}. Style: Gentle watercolor technique with flowing colors and soft edges, ethereal and atmospheric.`,
        
        realistic: `A photorealistic interpretation: ${dreamText}. Style: Hyperrealistic photography style with precise details and natural lighting.`,
        
        fantasy: `A fantasy art interpretation: ${dreamText}. Style: Epic fantasy art with magical elements and otherworldly atmosphere, rich in detail and wonder.`,
        
        abstract: `An abstract interpretation: ${dreamText}. Style: Modern abstract art focusing on shapes, colors, and emotions rather than literal representation.`,
        
        minimalist: `A minimalist interpretation: ${dreamText}. Style: Clean, minimal design with essential elements only, focused on simplicity and space.`
    };

    return stylePrompts[style] || stylePrompts.surreal;
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { dreamText, mood, imageStyle } = JSON.parse(event.body);
        
        // Generer billede
        const prompt = getImagePrompt(dreamText, imageStyle);
        const imageResponse = await axios.post('https://api.openai.com/v1/images/generations', {
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
