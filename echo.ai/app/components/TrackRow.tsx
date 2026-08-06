"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Play, Music, MoreVertical, Plus, Trash2, Check, AlertCircle } from "lucide-react";

interface TrackRowProps {
  track: any;
  index: number;
  isPlaying: boolean;
  userPlaylists?: any[];
  currentPlaylistId?: string;
  onPlay: () => void;
  onTrackRemoved?: (trackId: string) => void;
}

export default function TrackRow({
  track,
  index,
  isPlaying,
  userPlaylists: initialUserPlaylists,
  currentPlaylistId,
  onPlay,
  onTrackRemoved,
}: TrackRowProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);
  const [errorPlaylistId, setErrorPlaylistId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [playlists, setPlaylists] = useState<any[]>(initialUserPlaylists || []);
  const menuRef = useRef<HTMLDivElement>(null);

  const trackId = track.id?.videoId || track.id || track._id;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const userId = (session?.user as any)?.id || session?.user?.email || "default_user";

  // Keep playlists synchronized if passed via props
  useEffect(() => {
    if (initialUserPlaylists && initialUserPlaylists.length > 0) {
      setPlaylists(initialUserPlaylists);
    }
  }, [initialUserPlaylists]);

  // Fetch playlists automatically if parent page didn't supply them
  const fetchPlaylists = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${backendUrl}/api/playlists?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken || ""}` },
      });
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (err) {
      console.error("Failed to load playlists in TrackRow", err);
    }
  };

  // Close this menu if another TrackRow opens its menu
  useEffect(() => {
    const handleCloseOthers = (e: CustomEvent) => {
      if (e.detail !== trackId) {
        setShowMenu(false);
      }
    };
    window.addEventListener("close-all-track-menus" as any, handleCloseOthers as EventListener);
    return () => {
      window.removeEventListener("close-all-track-menus" as any, handleCloseOthers as EventListener);
    };
  }, [trackId]);

  // Close menu when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu) {
      // Close any other open menus across the page
      window.dispatchEvent(new CustomEvent("close-all-track-menus", { detail: trackId }));
      // Fetch playlists if not loaded yet
      if (playlists.length === 0) {
        fetchPlaylists();
      }
    }
    setShowMenu(!showMenu);
  };

  const handleAddToPlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdding(true);
    setErrorPlaylistId(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`${backendUrl}/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken || ""}`,
        },
        body: JSON.stringify({ userId, trackId, track }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAddedPlaylistId(playlistId);
        setTimeout(() => {
          setAddedPlaylistId(null);
          setShowMenu(false);
        }, 1200);
      } else {
        // Song is already in playlist or another error occurred
        setErrorPlaylistId(playlistId);
        setErrorMessage(data.message || "Already added");
        setTimeout(() => {
          setErrorPlaylistId(null);
          setErrorMessage(null);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to add track", err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFromPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPlaylistId) return;

    try {
      await fetch(`${backendUrl}/api/playlists/${currentPlaylistId}/tracks/${trackId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken || ""}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (onTrackRemoved) onTrackRemoved(trackId);
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to remove track", err);
    }
  };

  return (
    <div
      onClick={onPlay}
      className={`group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
        isPlaying
          ? "bg-purple-950/40 border-purple-500/50"
          : "bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/60"
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="w-6 text-center text-zinc-500 text-sm font-semibold group-hover:text-purple-400">
          {index + 1}
        </span>
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
          <img
            src={track.snippet?.thumbnails?.default?.url || track.thumbnail}
            alt={track.snippet?.title || track.title || "Track thumbnail"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play size={16} className="text-white fill-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm line-clamp-1 ${isPlaying ? "text-purple-400" : "text-white"}`}>
            {track.snippet?.title || track.title}
          </h3>
          <p className="text-zinc-500 text-xs truncate mt-0.5">
            {track.snippet?.channelTitle || track.artist}
          </p>
        </div>
      </div>

      {/* Action Area */}
      <div className="relative flex items-center gap-2" ref={menuRef}>
        <div className="text-zinc-500 group-hover:text-purple-400 transition-colors p-2">
          <Music size={18} />
        </div>

        {/* Options Button */}
        <button
          onClick={toggleMenu}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
        >
          <MoreVertical size={18} />
        </button>

        {/* Action Menu Popover */}
        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-10 z-30 w-52 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 space-y-1 text-xs"
          >
            {currentPlaylistId ? (
              <button
                onClick={handleRemoveFromPlaylist}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors font-medium text-left"
              >
                <Trash2 size={14} /> Remove from playlist
              </button>
            ) : (
              <>
                <div className="px-2 py-1 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                  Add to playlist
                </div>
                {playlists.length === 0 ? (
                  <div className="px-2 py-1.5 text-zinc-500 italic">No playlists available</div>
                ) : (
                  playlists.map((pl) => {
                    const plId = pl._id || pl.id;
                    const plName = pl.title || pl.name || "Untitled";
                    const isRecentlyAdded = addedPlaylistId === plId;
                    const isDuplicateError = errorPlaylistId === plId;

                    return (
                      <button
                        key={plId}
                        disabled={adding || isRecentlyAdded}
                        onClick={(e) => handleAddToPlaylist(plId, e)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors text-left truncate ${
                          isDuplicateError
                            ? "text-amber-400 bg-amber-500/10"
                            : isRecentlyAdded
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        {isRecentlyAdded ? (
                          <Check size={14} className="text-emerald-400 flex-shrink-0" />
                        ) : isDuplicateError ? (
                          <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                        ) : (
                          <Plus size={14} className="text-zinc-400 flex-shrink-0" />
                        )}
                        <span className="truncate flex-1">
                          {isDuplicateError ? errorMessage || "Already added" : plName}
                        </span>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}