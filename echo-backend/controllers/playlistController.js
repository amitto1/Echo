const Playlist = require('../models/Playlist');

// 1. Create Playlist
exports.createPlaylist = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const playlist = await Playlist.create({
      name,
      description: description || '',
      userId: req.user.id,
      tracks: [],
    });

    return res.status(201).json({ success: true, data: playlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Add Track to Playlist
exports.addTrackToPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).json({ success: false, message: 'trackId is required' });
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    // Ownership check
    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    // Prevent duplicate tracks in the array (optional)
    if (!playlist.tracks.includes(trackId)) {
      playlist.tracks.push(trackId);
      await playlist.save();
    }

    return res.status(200).json({ success: true, data: playlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Remove Track from Playlist
exports.removeTrackFromPlaylist = async (req, res) => {
  try {
    const { id, trackId } = req.params;

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    // Filter out the requested track ID
    playlist.tracks = playlist.tracks.filter((t) => t !== trackId);
    await playlist.save();

    return res.status(200).json({ success: true, data: playlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};