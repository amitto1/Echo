// app/artist/[name]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { Play, Flame, CheckCircle2 } from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import TrackRow from "../../components/TrackRow";

export default function ArtistPage({ params }: { params: Promise<{ name: string }> | { name: string } }) {
  const rawParams = params instanceof Promise ? use(params) : params;
  const rawName = rawParams?.name ? decodeURIComponent(rawParams.name) : "Featured Artist";
  const artistName = rawName !== "undefined" ? rawName : "Featured Artist";

  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const playSong = usePlayerStore((state) => state.playSong);
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const currentSong = queue[currentIndex];

  useEffect(() => {
    if (!artistName || artistName === "Featured Artist") return;

    const fetchArtistTracks = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(artistName)}`);
        const data = await res.json();
        
        if (data.items) {
          setTracks(data.items);
        }
      } catch (err) {
        console.error("Failed to load artist songs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistTracks();
  }, [artistName]);

  const heroImage = tracks[0]?.snippet?.thumbnails?.high?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80";

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      
      {/* Hero Banner Header */}
      <div className="relative h-72 md:h-80 w-full rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex items-end p-8">
        <img
          src={heroImage}
          alt={artistName}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.45] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full w-fit">
            <CheckCircle2 size={14} /> Verified Artist
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight capitalize">
            {artistName}
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Top tracks and popular releases on Echo.AI
          </p>
        </div>
      </div>

      {/* Play Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tracks.length > 0 && (
            <button
              onClick={() => playSong(tracks[0], tracks)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Play size={18} className="fill-white" />
              Play Top Songs
            </button>
          )}
        </div>
        <span className="text-zinc-500 text-sm font-medium">{tracks.length} Top Tracks</span>
      </div>

      {/* Tracks Listing */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Flame size={20} className="text-purple-500" /> Popular Tracks
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-800/60" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tracks.map((track, idx) => {
              const videoId = typeof track.id === "string" ? track.id : track.id?.videoId;
              const currentVideoId = currentSong ? (typeof currentSong.id === "string" ? currentSong.id : currentSong.id?.videoId) : null;
              const isCurrentPlaying = currentVideoId === videoId;

              return (
                <TrackRow
                  key={videoId || idx}
                  track={track}
                  index={idx}
                  isPlaying={isCurrentPlaying}
                  onPlay={() => playSong(track, tracks)}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}