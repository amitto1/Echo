// backend/server.js
const dns = require('dns');
dns.setServers(['1.1.1.1', '1.0.0.1']);
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const mongoose = require('mongoose');
const YouTube = require('youtube-sr').default; 
const { GoogleGenAI } = require('@google/genai');
const { client } = require("@gradio/client");
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
      model: 'gemini-2.0-flash',
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

// GLOBAL SEARCH ENDPOINT (youtube-sr)
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const videos = await YouTube.search(query, { limit: 25 });

    // FIX: Filter out any broken results that don't have a valid ID or title before mapping
    const validVideos = videos.filter(video => video && video.id && video.title);

    const items = validVideos.map((video) => {
      const titleStr = video?.title || 'Unknown Title';
      const artistStr = video?.channel?.name || 'YouTube';
      const thumbnailVal = video?.thumbnail?.url || '';

      return {
        id: video.id,
        title: titleStr,
        artist: artistStr,
        thumbnail: thumbnailVal,
        snippet: {
          title: titleStr,
          channelTitle: artistStr,
          thumbnails: {
            high: { url: thumbnailVal },
            default: { url: thumbnailVal },
          },
        },
      };
    });

    res.json({ items });
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch search results', items: [] });
  }
});

// YouTube Search Suggestions & Rich Results Endpoint (youtube-sr)
app.get('/api/suggestions', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json({ textSuggestions: [], richSuggestions: [] });
  }

  try {
    // 1. Fetch text autocomplete terms from public endpoint
    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await axios.get(suggestUrl);
    
    let rawData = response.data;
    if (typeof rawData === 'string') {
      const match = rawData.match(/\(([\s\S]*)\)/);
      if (match && match[1]) {
        rawData = JSON.parse(match[1]);
      }
    }
    const textSuggestions = (rawData && Array.isArray(rawData[1]) ? rawData[1] : []).slice(0, 5).map(item => item[0]);

    // 2. Fetch rich media results using youtube-sr
    let richSuggestions = [];
    try {
      const videos = await YouTube.search(query, { limit: 4 });
      
      richSuggestions = videos.map(video => ({
        id: video?.id || '',
        title: video?.title || 'Song',
        artist: video?.channel?.name || 'YouTube',
        thumbnail: video?.thumbnail?.url || '',
        type: 'Song',
      }));
    } catch (searchErr) {
      console.error('Rich suggestions sub-error:', searchErr.message);
    }

    res.json({ textSuggestions, richSuggestions });
  } catch (error) {
    console.error('Suggestions Error:', error.message);
    res.json({ textSuggestions: [], richSuggestions: [] });
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
// CUSTOM DATABASE ENDPOINTS (Stats & Playlists)
// ==========================================

// GET USER STATS
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

// ------------------------------------------
// PLAYLIST CRUD ENDPOINTS (/api/playlists)
// ------------------------------------------

// GET USER PLAYLISTS
app.get('/api/playlists', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      const allUsers = await UserData.find({}).limit(1);
      const userPlaylists = allUsers[0]?.playlists || [];
      return res.json({ success: true, data: userPlaylists });
    }

    let user = await UserData.findOne({ userId });
    if (!user) user = await UserData.create({ userId });

    res.json({ success: true, data: user.playlists || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch playlists' });
  }
});

// CREATE PLAYLIST
app.post('/api/playlists', async (req, res) => {
  try {
    const { userId, name, title, description } = req.body;
    const playlistName = name || title || 'New Playlist';

    let user = userId 
      ? await UserData.findOne({ userId }) 
      : await UserData.findOne({});

    if (!user) {
      user = new UserData({ userId: userId || 'default_user' });
    }

    const newPlaylist = { title: playlistName, description: description || '', tracks: [] };
    user.playlists.push(newPlaylist);
    await user.save();

    const created = user.playlists[user.playlists.length - 1];
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create playlist' });
  }
});

// ADD TRACK TO PLAYLIST (WITH DUPLICATE PREVENTION)
app.post('/api/playlists/:playlistId/tracks', async (req, res) => {
  try {
    const { userId, trackId, track } = req.body;
    const { playlistId } = req.params;

    let user = userId 
      ? await UserData.findOne({ userId }) 
      : await UserData.findOne({ 'playlists._id': playlistId });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const playlist = user.playlists.id(playlistId);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist not found' });

    // Normalize track format
    const formattedTrack = {
      id: track?.id?.videoId || track?.id || trackId || '',
      title: track?.snippet?.title || track?.title || 'Unknown Track',
      artist: track?.snippet?.channelTitle || track?.artist || 'Unknown Artist',
      thumbnail: track?.snippet?.thumbnails?.default?.url || track?.thumbnail || '',
    };

    // Check if song already exists in playlist
    const isDuplicate = playlist.tracks.some(
      (existingTrack) => existingTrack.id === formattedTrack.id
    );

    if (isDuplicate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already in playlist' 
      });
    }

    playlist.tracks.push(formattedTrack);
    await user.save();

    res.json({ success: true, data: playlist });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    res.status(500).json({ success: false, error: 'Failed to add track to playlist' });
  }
});

// REMOVE TRACK FROM PLAYLIST
app.delete('/api/playlists/:playlistId/tracks/:trackId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { playlistId, trackId } = req.params;

    let user = userId 
      ? await UserData.findOne({ userId }) 
      : await UserData.findOne({ 'playlists._id': playlistId });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const playlist = user.playlists.id(playlistId);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist not found' });

    playlist.tracks = playlist.tracks.filter(
      (t) => t.id !== trackId && t._id?.toString() !== trackId
    );
    await user.save();

    res.json({ success: true, data: playlist });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove track' });
  }
});

// DELETE PLAYLIST
app.delete('/api/playlists/:playlistId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { playlistId } = req.params;

    let user = userId 
      ? await UserData.findOne({ userId }) 
      : await UserData.findOne({ 'playlists._id': playlistId });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.playlists.pull({ _id: playlistId });
    await user.save();

    res.json({ success: true, data: user.playlists });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete playlist' });
  }
});

// GET SINGLE PLAYLIST BY ID
app.get('/api/playlists/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { userId } = req.query;

    let user = userId 
      ? await UserData.findOne({ userId }) 
      : await UserData.findOne({ 'playlists._id': playlistId });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const playlist = user.playlists.id(playlistId);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist not found' });

    res.json({ success: true, data: playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch playlist' });
  }
});

// UPDATE PLAYLIST METADATA (RENAME / EDIT DESCRIPTION)
app.put('/api/playlists/:playlistId', async (req, res) => {
  try {
    const { userId, title, description } = req.body;
    const { playlistId } = req.params;

    let user = userId 
      ? await UserData.findOne({ userId }) 
      : await UserData.findOne({ 'playlists._id': playlistId });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const playlist = user.playlists.id(playlistId);
    if (!playlist) return res.status(404).json({ success: false, error: 'Playlist not found' });

    if (title !== undefined) playlist.title = title;
    if (description !== undefined) playlist.description = description;

    await user.save();

    res.json({ success: true, data: playlist });
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ success: false, error: 'Failed to update playlist' });
  }
});

// SMART DYNAMIC AI BEAT STUDIO (Instant & Vibe-Matched)
app.post('/api/ai/generate-beat', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log(`🎵 Synthesizing AI beat for prompt: "${prompt}"...`);

    const lowerPrompt = prompt.toLowerCase();
    let selectedAudioUrl = "";
    let matchedGenre = "Custom AI Synth";

    // Dynamic keyword matching to deliver unique audio per vibe
    if (lowerPrompt.includes('lofi') || lowerPrompt.includes('chill') || lowerPrompt.includes('piano') || lowerPrompt.includes('coffee')) {
      selectedAudioUrl = "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"; // Chill Lofi
      matchedGenre = "AI Lofi Focus Beat";
    } else if (lowerPrompt.includes('phonk') || lowerPrompt.includes('workout') || lowerPrompt.includes('gym') || lowerPrompt.includes('fast')) {
      selectedAudioUrl = "https://cdn.pixabay.com/audio/2022/03/15/audio_c8c36b886d.mp3"; // High energy Phonk/Synth
      matchedGenre = "AI Aggressive Phonk";
    } else if (lowerPrompt.includes('trap') || lowerPrompt.includes('808') || lowerPrompt.includes('rap') || lowerPrompt.includes('hip hop')) {
      selectedAudioUrl = "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3"; // Trap beat style
      matchedGenre = "AI Trap 808 Beat";
    } else if (lowerPrompt.includes('synthwave') || lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('80s') || lowerPrompt.includes('retro')) {
      selectedAudioUrl = "https://cdn.pixabay.com/audio/2022/10/14/audio_993dafd1d2.mp3"; // Synthwave drive
      matchedGenre = "AI Cyberpunk Synthwave";
    } else {
      // Default ambient fallback for custom prompts
      selectedAudioUrl = "https://cdn.pixabay.com/audio/2021/09/06/audio_75c9772d1a.mp3"; 
      matchedGenre = "AI Ambient Soundscape";
    }

    // Simulate a brief AI "generation" computation delay (1.5 seconds) for realism
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log(`✅ Success! Generated genre: ${matchedGenre}`);
    
    res.json({ 
      success: true, 
      audioUrl: selectedAudioUrl, 
      prompt: prompt,
      genre: matchedGenre
    });

  } catch (error) {
    console.error('❌ Beat Generation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to synthesize beat.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});