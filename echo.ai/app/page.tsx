// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Clock, Play, Heart, Music } from "lucide-react";
import { usePlayerStore } from "./store/usePlayerStore";
import TrendingArtists from "./components/TrendingArtists";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const [greeting, setGreeting] = useState("Good morning");
  const [likedPlaylists, setLikedPlaylists] = useState<any[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Grab playback history or queue from Zustand
  const queue = usePlayerStore((state) => state.queue);
  const playSong = usePlayerStore((state) => state.playSong);

  // Dynamic time-based greeting fix
  useEffect(() => {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
      setGreeting("Good morning");
    } else if (currentHour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // Fetch top user playlists for quick access
  useEffect(() => {
    const fetchHomePlaylists = async () => {
      if (status !== "authenticated" || !(session as any)?.accessToken) return;
      setIsLoadingPlaylists(true);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/library/playlists`, {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        });
        const data = await res.json();
        if (res.ok && data.items) {
          setLikedPlaylists(data.items.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching home playlists:", err);
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    fetchHomePlaylists();
  }, [session, status]);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">

      {/* Hero Greeting Section with Purple Glow */}
      <div className="relative overflow-hidden bg-gradient-to-b from-purple-900/30 via-zinc-900/40 to-transparent border border-zinc-800/80 rounded-3xl p-8 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
              {greeting}, {session?.user?.name ? session.user.name.split(" ")[0] : "Music Lover"}
            </h1>
            <p className="text-zinc-400 text-sm md:text-base font-medium">
              Ready to explore some sounds today? Jump back into your queue or search a vibe.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 px-4 py-2 rounded-full text-purple-400 text-sm font-medium">
            <Sparkles size={16} />
            <span>Echo.AI Engine Ready</span>
          </div>
        </div>
      </div>

      {/* Dynamic Trending Artists Section */}
      <TrendingArtists />

      {/* Top Playlists Section */}
      {status === "authenticated" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Heart size={20} className="text-purple-500" />
            Your Top Playlists
          </h2>

          {isLoadingPlaylists ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-zinc-900/50 rounded-xl animate-pulse border border-zinc-800"></div>
              ))}
            </div>
          ) : likedPlaylists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {likedPlaylists.map((pl) => (
                <Link
                  key={pl.id}
                  href={`/playlists/${pl.id}`}
                  className="flex items-center gap-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl p-3 transition-all group"
                >
                  <div className="w-14 h-14 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {pl.snippet?.thumbnails?.default?.url ? (
                      <img src={pl.snippet.thumbnails.default.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music size={20} className="text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-purple-400 transition-colors">
                      {pl.snippet?.title}
                    </h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Playlist</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Recently Played / Queue Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock size={20} className="text-purple-500" />
            Recently Listened & Queue
          </h2>
        </div>

        {queue.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-zinc-400 text-sm">No songs in your history yet.</p>
            <p className="text-zinc-600 text-xs">Head over to Explore or your Library to start playing music!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.slice(0, 6).map((song, index) => (
              <div
                key={song.id?.videoId || song.id || index}
                onClick={() => playSong(song, queue)}
                className="group flex items-center gap-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl p-3 cursor-pointer transition-all shadow-sm"
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                  <img
                    src={song.snippet?.thumbnails?.medium?.url || song.snippet?.thumbnails?.default?.url}
                    alt={song.snippet?.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play size={20} className="text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {song.snippet?.title}
                  </h3>
                  <p className="text-zinc-400 text-xs line-clamp-1 mt-0.5">
                    {song.snippet?.channelTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}