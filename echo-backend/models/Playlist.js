const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Playlist name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tracks: [
      {
        type: String, // Array of Track IDs
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Playlist || mongoose.model('Playlist', PlaylistSchema);