const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Improved CORS setup
app.use(cors()); // Allow all origins for testing (adjust for production)

// Body parsing middleware
app.use(express.json());

// Environment variables (create a .env file)
require('dotenv').config();
const APP_ID = process.env.OXFORD_APP_ID || 'b25b7aab';
const APP_KEY = process.env.OXFORD_APP_KEY || '7bfk6rpkgvbl2of6g87omxcpagr66epp';

// Dictionary endpoint (fixed structure)
app.get('/api/dictionary/:word', async (req, res) => {
  try {

    const { word } = req.params;
    const searchTerm = word.toLowerCase(); // ✅ Correct



    
    const response = await axios.get(
      `https://od-api-sandbox.oxforddictionaries.com/api/v2/entries/en-gb/${word}`,
      {
        headers: {
          'app_id': APP_ID,
          'app_key': APP_KEY,
          'Accept': 'application/json'
        },
        timeout: 5000 // 5-second timeout
      }
    );

    // Proper Oxford API response parsing
    const lexicalEntries = response.data.results[0].lexicalEntries;
    const definitions = lexicalEntries.map(entry => ({
      partOfSpeech: entry.lexicalCategory.text,
      definitions: entry.entries[0].senses.map(sense => ({
        definition: sense.definitions?.[0],
        examples: sense.examples?.map(ex => ex.text)
      }))
    }));


    // In your backend's success response:
res.json({ 
  word: response.data.word, 
  phonetic: lexicalEntries[0].entries[0].pronunciations?.[0]?.phoneticSpelling, 
  meanings: lexicalEntries.map(entry => ({ // Changed from 'definitions' to 'meanings'
    partOfSpeech: entry.lexicalCategory.text, 
    definitions: entry.entries[0].senses.map(sense => ({
      definition: sense.definitions?.[0], 
      example: sense.examples?.[0]?.text
    }))
  }))
 });

  } catch (error) {
    console.error('API Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'API request timeout' });
    }
    
    const status = error.response?.status || 500;
    res.status(status).json({ 
      error: 'Dictionary service unavailable',
      details: status === 403 ? 'Check API credentials' : undefined
    });
  }
});

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
