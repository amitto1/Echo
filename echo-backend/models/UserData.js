// models/UserData.js
const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  id: String,
  title: String,
  artist: String,
  thumbnail: String,
}, { _id: true, strict: false });

const PlaylistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  tracks: [TrackSchema],
  createdAt: { type: Date, default: Date.now },
});

const UserDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  secondsToday: { type: Number, default: 0 },
  streakDays: { type: Number, default: 1 },
  lastActiveDate: { type: String, default: null },
  playlists: [PlaylistSchema],
});

module.exports = mongoose.model('UserData', UserDataSchema);