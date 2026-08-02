const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows http://localhost:3000 (Next.js) to talk to port 5000
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Echo Express Backend is running!');
});

// YouTube Search API Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${process.env.YOUTUBE_API_KEY}`;
    
    const response = await axios.get(youtubeUrl);
    res.json(response.data);
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch search results from YouTube' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});