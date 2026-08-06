const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your JWT/Session auth middleware
const {
  createPlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
} = require('../controllers/playlistController');

router.use(auth); // Protect all playlist routes

// Playlist creation
router.post('/', createPlaylist);

// Track additions/deletions
router.post('/:id/tracks', addTrackToPlaylist);
router.delete('/:id/tracks/:trackId', removeTrackFromPlaylist);

module.exports = router;