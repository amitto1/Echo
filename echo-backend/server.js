// backend/server.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const UserData = require('./models/UserData');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGODB_URI missing in .env. DB endpoints will fail.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('Echo Express Backend is running!');
});

// AI Vibe Recommendation Route
app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt parameter is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert music curator. Based on the user's mood or topic: "${prompt}", generate 5 popular songs with artist names. Return ONLY a raw JSON array of strings formatted like: ["Song Title - Artist", "Song Title - Artist"]. Do not wrap in markdown or backticks.`,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let songQueries = [];

    if (jsonMatch) {
      try {
        songQueries = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
      }
    }

    if (!Array.isArray(songQueries) || songQueries.length === 0) {
      songQueries = [`${prompt} music`, `${prompt} songs`, `best of ${prompt}`];
    }

    res.json({ queries: songQueries });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI playlist', queries: [`${req.body.prompt} playlist`] });
  }
});

// YouTube Search API Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${process.env.YOUTUBE_API_KEY}`;
    const response = await axios.get(youtubeUrl);
    res.json(response.data);
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch search results from YouTube' });
  }
});

// Fetch User's Liked Songs (YouTube API)
app.get('/api/library/liked', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?myRating=like&part=snippet,contentDetails&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );

    res.json(response.data);
  } catch (error) {
    console.error('YouTube API Error (Liked Songs):', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch library' });
  }
});

// FETCH YOUTUBE PLAYLISTS
app.get('/api/library/playlists', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// FETCH SONGS INSIDE YOUTUBE PLAYLIST
app.get('/api/library/playlists/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const playlistId = req.params.id;

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlist items' });
  }
});

// ==========================================
// CUSTOM DATABASE ENDPOINTS (Stats & CRUD)
// ==========================================

// GET USER STATS & PLAYLISTS
app.get('/api/user/data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let user = await UserData.findOne({ userId });
    if (!user) {
      user = await UserData.create({ userId });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// TICK STATS (Sync active listening seconds)
app.post('/api/user/stats/tick', async (req, res) => {
  try {
    const { userId, addedSeconds } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const today = new Date().toISOString().split('T')[0];
    let user = await UserData.findOne({ userId });

    if (!user) {
      user = new UserData({ userId });
    }

    if (user.lastActiveDate !== today) {
      if (user.lastActiveDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (user.lastActiveDate === yesterdayStr) {
          user.streakDays += 1;
        } else {
          user.streakDays = 1;
        }
      }
      user.secondsToday = 0;
      user.lastActiveDate = today;
    }

    user.secondsToday += addedSeconds || 5;
    await user.save();

    res.json({ secondsToday: user.secondsToday, streakDays: user.streakDays });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync stats' });
  }
});

// CREATE CUSTOM PLAYLIST
app.post('/api/user/playlists', async (req, res) => {
  try {
    const { userId, title, description } = req.body;
    let user = await UserData.findOne({ userId });
    if (!user) user = new UserData({ userId });

    user.playlists.push({ title, description, tracks: [] });
    await user.save();

    res.json(user.playlists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// ADD TRACK TO CUSTOM PLAYLIST
app.post('/api/user/playlists/:playlistId/tracks', async (req, res) => {
  try {
    const { userId, track } = req.body;
    const { playlistId } = req.params;

    const user = await UserData.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const playlist = user.playlists.id(playlistId);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

    playlist.tracks.push(track);
    await user.save();

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add track to playlist' });
  }
});

// DELETE CUSTOM PLAYLIST
app.delete('/api/user/playlists/:playlistId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { playlistId } = req.params;

    const user = await UserData.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.playlists.pull({ _id: playlistId });
    await user.save();

    res.json(user.playlists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});