const axios = require('axios');

function createImagePrompt(dreamText) {
    // Basisstil for alle drømmebilleder
    const baseStyle = "dreamlike, surreal art, ethereal atmosphere, soft lighting";
    
    // Vælg en kunstnerisk stil
    const artStyles = [
        "in the style of Salvador Dali",
        "like a watercolor painting",
        "as an impressionist artwork",
        "with floating elements",
        "with mystical elements"
    ];
    
    // Vælg en farvepalette
    const colorPalettes = [
        "using ethereal pastel colors",
        "with deep vibrant colors",
        "in cosmic purple and blue tones",
        "with golden luminescent light",
        "with mystical fog effects"
    ];

    // Vælg tilfældige stilelementer
    const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
    const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

    // Byg den endelige prompt
    const prompt = `Create a surreal and artistic interpretation of this dream scene: ${dreamText}. 
        Make it ${randomStyle}, ${randomPalette}. 
        The image should be highly detailed, ${baseStyle}, 
        emphasizing the dreamlike quality with floating or morphing elements. 
        Create a mysterious and engaging atmosphere that captures the essence of a dream.`;

    return prompt;
}

exports.handler = async function(event, context) {
    console.log('Function started');
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { dreamText } = JSON.parse(event.body);
        console.log('Received dream text:', dreamText);
        
        if (!process.env.OPENAI_API_KEY) {
            console.error('API Key is missing');
            throw new Error('Missing OpenAI API Key');
        }
        
        const imagePrompt = createImagePrompt(dreamText);
        console.log('Generated prompt:', imagePrompt);
        
        const openaiResponse = await axios({
            method: 'post',
            url: 'https://api.openai.com/v1/images/generations',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                prompt: imagePrompt,
                n: 1,
                size: "1024x1024",
                model: "dall-e-3",  // Opgraderet til DALL-E 3 for bedre kvalitet
                quality: "hd",      // Høj kvalitet
                style: "vivid"      // Mere livlige og detaljerede billeder
            }
        });
        
        console.log('OpenAI response received:', JSON.stringify(openaiResponse.data));

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                imageUrl: openaiResponse.data.data[0].url,
                prompt: imagePrompt  // Sender prompt tilbage så vi kan se hvad der blev brugt
            })
        };
    } catch (error) {
        console.error('Error occurred:', error);
        console.error('Error response:', error.response?.data);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to generate image',
                message: error.message,
                details: error.response?.data
            })
        };
    }
};
