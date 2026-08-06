"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ListMusic, Play, Pencil, Trash2 } from "lucide-react";
import { usePlayerStore } from "../../../app/store/usePlayerStore";
import TrackRow from "../../../app/components/TrackRow";
import EditPlaylistModal from "../../../app/components/EditPlaylistModel";

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params?.id as string;
  const { data: session, status } = useSession();
  
  const [playlist, setPlaylist] = useState<any>(null);
  const [customPlaylists, setCustomPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const playSong = usePlayerStore((state) => state.playSong);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetchPlaylistData();
  }, [playlistId, session, status]);

  const fetchPlaylistData = async () => {
    if (!playlistId || status !== "authenticated") return;

    setLoading(true);
    const userId = (session?.user as any)?.id || session?.user?.email || "default_user";
    const token = (session as any)?.accessToken || "";

    try {
      const userPlaylistsRes = await fetch(
        `${backendUrl}/api/playlists?userId=${encodeURIComponent(userId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (userPlaylistsRes.ok) {
        const data = await userPlaylistsRes.json();
        if (data.success) setCustomPlaylists(data.data);
      }

      // 1. Try fetching from custom MongoDB playlists
      const customRes = await fetch(
        `${backendUrl}/api/playlists/${playlistId}?userId=${encodeURIComponent(userId)}`
      );
      const customData = await customRes.json();

      if (customRes.ok && customData.success) {
        setPlaylist({
          id: customData.data._id,
          title: customData.data.title || customData.data.name,
          description: customData.data.description,
          tracks: customData.data.tracks || [],
          isYouTube: false,
        });
        setLoading(false);
        return;
      }

      // 2. Fallback: Fetch from YouTube Playlist API
      const ytRes = await fetch(
        `${backendUrl}/api/library/playlists/${playlistId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const ytData = await ytRes.json();

      if (ytRes.ok && ytData.items) {
        const formattedTracks = ytData.items.map((item: any) => ({
          id: item.snippet?.resourceId?.videoId || item.contentDetails?.videoId || item.id,
          title: item.snippet?.title || "Untitled Video",
          artist: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "YouTube",
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
          snippet: item.snippet,
        }));

        setPlaylist({
          id: playlistId,
          title: "YouTube Playlist",
          description: "Synced from YouTube Library",
          tracks: formattedTracks,
          isYouTube: true,
        });
        setLoading(false);
        return;
      }

      setPlaylist(null);
    } catch (err) {
      console.error("Failed to load playlist details", err);
      setPlaylist(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist || playlist.isYouTube) return;
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    setDeleting(true);
    try {
      const userId = (session?.user as any)?.id || session?.user?.email || "default_user";
      const response = await fetch(`${backendUrl}/api/playlists/${playlist.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken || ""}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        window.dispatchEvent(new Event("playlists-updated"));
        router.push("/playlists");
      }
    } catch (err) {
      console.error("Failed to delete playlist", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleTrackRemoved = (trackId: string) => {
    if (!playlist) return;
    setPlaylist((prev: any) => ({
      ...prev,
      tracks: prev.tracks.filter((t: any) => (t.id || t._id) !== trackId),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-500 animate-pulse text-sm">
        Loading playlist tracks...
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 gap-2">
        <ListMusic size={48} className="text-zinc-700" />
        <p className="text-lg font-semibold text-zinc-400">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className={`flex items-end justify-between p-6 rounded-2xl border ${
        playlist.isYouTube 
          ? "bg-gradient-to-b from-red-950/40 via-zinc-900/40 to-zinc-900 border-red-900/30"
          : "bg-gradient-to-b from-purple-900/40 via-zinc-900/40 to-zinc-900 border-zinc-800/80"
      }`}>
        <div className="flex items-end gap-6">
          <div className="w-36 h-36 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden">
            {playlist.tracks[0]?.thumbnail ? (
              <img src={playlist.tracks[0].thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <ListMusic size={56} className={playlist.isYouTube ? "text-red-500" : "text-purple-400"} />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              playlist.isYouTube ? "text-red-400" : "text-purple-400"
            }`}>
              {playlist.isYouTube ? <><YoutubeIcon /> YouTube Playlist</> : "Echo Playlist"}
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {playlist.title}
            </h1>
            {playlist.description && (
              <p className="text-sm text-zinc-400 line-clamp-2">
                {playlist.description}
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              {playlist.tracks?.length || 0} {playlist.tracks?.length === 1 ? "song" : "songs"}
            </p>
          </div>
        </div>

        {/* Custom Playlist Header Action Buttons */}
        {!playlist.isYouTube && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
              title="Edit Playlist Details"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={handleDeletePlaylist}
              disabled={deleting}
              className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors border border-red-800/40"
              title="Delete Playlist"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Playlist Controls */}
      {playlist.tracks && playlist.tracks.length > 0 && (
        <div className="flex items-center gap-4 px-2">
          <button
            onClick={() => playSong(playlist.tracks[0], playlist.tracks)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg hover:scale-105 text-white ${
              playlist.isYouTube ? "bg-red-600 hover:bg-red-500" : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            <Play size={18} className="fill-white" /> Play All
          </button>
        </div>
      )}

      {/* Track List */}
      <div className="flex flex-col gap-2">
        {!playlist.tracks || playlist.tracks.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 text-zinc-500 text-sm">
            This playlist has no available videos or tracks.
          </div>
        ) : (
          playlist.tracks.map((track: any, idx: number) => {
            const trackId = track.id || track._id;
            return (
              <TrackRow
                key={trackId || idx}
                track={track}
                index={idx}
                isPlaying={currentTrack?.id === trackId || currentTrack?.id?.videoId === trackId}
                userPlaylists={customPlaylists}
                currentPlaylistId={playlist.isYouTube ? undefined : playlist.id}
                onPlay={() => playSong(track, playlist.tracks)}
                onTrackRemoved={handleTrackRemoved}
              />
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      <EditPlaylistModal
        isOpen={isEditOpen}
        playlist={playlist}
        onClose={() => setIsEditOpen(false)}
        onPlaylistUpdated={(updated) => {
          setPlaylist((prev: any) => ({
            ...prev,
            title: updated.title,
            description: updated.description,
          }));
          window.dispatchEvent(new Event("playlists-updated"));
        }}
      />
    </div>
  );
}