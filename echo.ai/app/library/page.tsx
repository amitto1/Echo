// app/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore"; 
import SongListItem from "../components/SongListItem";

export default function Library() {
  const { data: session, status } = useSession();
  
  // 2. Grab the global play function instead of the old Context
  const playSong = usePlayerStore((state) => state.playSong);
  
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLikedSongs = async () => {
      // Don't fetch if not logged in
      if (status !== "authenticated" || !(session as any)?.accessToken) return;

      setIsLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        
        // Pass the Google token to our Express backend
        const response = await fetch(`${backendUrl}/api/library/liked`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        });

        const data = await response.json();

        if (response.ok && data.items) {
          setLikedSongs(data.items);
        } else {
          setError(data.error || "Failed to load liked songs.");
        }
      } catch (err) {
        setError("Network error connecting to backend.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedSongs();
  }, [session, status]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-purple-900/40 to-zinc-900/40 border border-zinc-800 rounded-2xl p-8 shadow-sm max-w-5xl flex items-end gap-6 h-48">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
          <Heart size={48} className="text-white fill-white" />
        </div>
        <div className="pb-2">
          <p className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Playlist</p>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Liked Songs</h1>
          <p className="text-zinc-400 text-sm font-medium">
            {status === "authenticated" ? session.user?.name : "Log in to see your songs"} 
            {likedSongs.length > 0 && ` • ${likedSongs.length} songs`}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl mt-2">
        {status === "unauthenticated" && (
          <div className="text-center py-20 border border-zinc-800 border-dashed rounded-xl">
            <h3 className="text-lg font-medium text-white mb-1">You are not logged in</h3>
            <p className="text-zinc-500 text-sm">Please log in with Google to view your Liked Songs.</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="text-red-400 bg-red-950/30 p-4 rounded-lg border border-red-900/50">
            Error: {error}
          </div>
        )}

        {!isLoading && !error && likedSongs.length > 0 && (
          <div className="flex flex-col">
            {likedSongs.map((video, index) => (
              <SongListItem 
                key={video.id} 
                video={video} 
                index={index}
                // 3. THE MAGIC: Send both the clicked video AND the entire likedSongs array!
                onClick={() => playSong(video, likedSongs)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}