"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AiVibeGenerator from "@/app/components/AiVibeGenerator";
import { usePlayerStore } from "../store/usePlayerStore";
import { Music } from "lucide-react";
import TrackRow from "../components/TrackRow";

export default function ExplorePage() {
  const queue = usePlayerStore((state) => state.queue);
  const playSong = usePlayerStore((state) => state.playSong);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<any[]>([]);

  // Fetch the user's playlists so we can pass them down to TrackRow
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (status !== "authenticated") return;
      
      const userId = (session?.user as any)?.id || session?.user?.email || "default_user";
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      
      try {
        const res = await fetch(`${backendUrl}/api/playlists?userId=${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken || ""}` },
        });
        const data = await res.json();
        if (data.success) {
          setPlaylists(data.data);
        }
      } catch (err) {
        console.error("Failed to load playlists", err);
      }
    };
    
    fetchPlaylists();
  }, [session, status]);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      
      {/* Sleek AI Search Bar & Suggestions */}
      <AiVibeGenerator />

      {/* Track List Results */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Music size={20} className="text-purple-500" />
            Curated Track Results
          </h2>

          <div className="flex flex-col gap-2">
            {queue.map((track, idx) => {
              const trackId = track.id?.videoId || track.id || track._id;
              
              return (
                <TrackRow
                  key={trackId || idx}
                  track={track}
                  index={idx}
                  isPlaying={currentTrack?.id?.videoId === trackId || currentTrack?.id === trackId}
                  userPlaylists={playlists}
                  onPlay={() => playSong(track, queue)}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}