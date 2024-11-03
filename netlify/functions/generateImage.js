const axios = require('axios');

exports.handler = async function(event, context) {
    // Basic error handling for non-POST requests
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Simple test response
        return {
            statusCode: 200,
            body: JSON.stringify({
                imageUrl: "https://placeholder.com/image",
                analysis: "Test analyse"
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
