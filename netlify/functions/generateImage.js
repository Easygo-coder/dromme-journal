const axios = require('axios');

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
    
    console.log('Making request to OpenAI...');
    
    const openaiResponse = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/images/generations',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        prompt: `A dream-like surreal image: ${dreamText}`,
        n: 1,
        size: "1024x1024",
        model: "dall-e-2"
      }
    });
    
    console.log('OpenAI response received:', JSON.stringify(openaiResponse.data));

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl: openaiResponse.data.data[0].url })
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
