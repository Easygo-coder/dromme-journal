const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { dreamText } = JSON.parse(event.body);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API Key');
    }

    console.log('Attempting to generate image for text:', dreamText);
    
    const response = await axios.post('https://api.openai.com/v1/images/generations', {
      prompt: `A dream-like surreal image: ${dreamText}`,
      n: 1,
      size: "1024x1024",
      model: "dall-e-2"
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('OpenAI API Response:', response.data);

    if (!response.data || !response.data.data || !response.data.data[0].url) {
      throw new Error('Invalid response from OpenAI');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl: response.data.data[0].url })
    };
  } catch (error) {
    console.error('Error details:', error.response ? error.response.data : error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate image',
        details: error.message,
        openaiError: error.response ? error.response.data : null
      })
    };
  }
};
