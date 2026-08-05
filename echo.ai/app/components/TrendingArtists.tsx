// app/components/TrendingArtists.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Flame, Sparkles } from "lucide-react";
import Link from "next/link";

interface Artist {
  id: string;
  name: string;
  tag: string;
  image: string;
}

export default function TrendingArtists() {
  const { data: session, status } = useSession();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      setIsLoading(true);

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        
        // Grab last search term from local storage if user searched recently
        const recentSearch = typeof window !== "undefined" ? localStorage.getItem("echo_last_search") : null;
        const queryParam = recentSearch ? encodeURIComponent(recentSearch) : "trending music artists";

        const res = await fetch(`${backendUrl}/api/search?q=${queryParam}&type=artist`, {
          headers: status === "authenticated" && (session as any)?.accessToken ? {
            Authorization: `Bearer ${(session as any).accessToken}`,
          } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const mappedArtists = data.items.slice(0, 4).map((item: any, index: number) => ({
              id: item.id?.channelId || item.id?.videoId || `artist-${index}`,
              name: item.snippet?.channelTitle || item.snippet?.title || "Featured Artist",
              tag: recentSearch ? `Based on "${recentSearch}"` : "Trending",
              image: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
            }));
            setArtists(mappedArtists);
            setIsLoading(false);
            return;
          }
        }

        setArtists(DEFAULT_ARTISTS);
      } catch (err) {
        console.error("Error fetching dynamic artists:", err);
        setArtists(DEFAULT_ARTISTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingArtists();
  }, [session, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Flame size={20} className="text-purple-500" />
          Trending & Recommended Artists
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-col items-center bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl animate-pulse">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800 mb-4"></div>
              <div className="h-4 w-20 bg-zinc-800 rounded mb-2"></div>
              <div className="h-3 w-12 bg-zinc-800/60 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${encodeURIComponent(artist.name)}`}
              className="group flex flex-col items-center bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 p-5 rounded-2xl transition-all cursor-pointer text-center hover:border-purple-500/50 shadow-sm"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-4 border-2 border-zinc-700 group-hover:border-purple-500 transition-colors shadow-lg">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-white font-bold text-base group-hover:text-purple-400 transition-colors line-clamp-1">
                {artist.name}
              </h3>
              <p className="text-zinc-500 text-xs mt-1 line-clamp-1 flex items-center gap-1">
                <Sparkles size={12} className="text-purple-400" />
                {artist.tag}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_ARTISTS: Artist[] = [
  { id: "1", name: "The Weeknd", tag: "Pop / R&B", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300" },
  { id: "2", name: "Drake", tag: "Hip-Hop", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300" },
  { id: "3", name: "Taylor Swift", tag: "Pop", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300" },
  { id: "4", name: "Daft Punk", tag: "Electronic", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300" },
];