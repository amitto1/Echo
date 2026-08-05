// app/playlists/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ListMusic } from "lucide-react";

export default function PlaylistsPage() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlaylists = async () => {
      // Cast session to any for NextAuth accessToken property
      if (status !== "authenticated" || !(session as any)?.accessToken) return;

      setIsLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        
        const response = await fetch(`${backendUrl}/api/library/playlists`, {
          headers: {
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.items) {
          setPlaylists(data.items);
        } else {
          setError(data.error || "Failed to load playlists.");
        }
      } catch (err) {
        setError("Network error connecting to backend.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [session, status]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-zinc-900/40 border border-zinc-800 rounded-2xl p-8 shadow-sm max-w-6xl flex items-end gap-6 h-48">
        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
          <ListMusic size={48} className="text-white" />
        </div>
        <div className="pb-2">
          <p className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Your Collection</p>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Playlists</h1>
          <p className="text-zinc-400 text-sm font-medium">
            {playlists.length > 0 ? `${playlists.length} playlists found` : "Loading your collection..."}
          </p>
        </div>
      </div>

      {/* Grid Content Area */}
      <div className="w-full max-w-6xl mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoading && playlists.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {playlists.map((playlist) => (
              <Link 
                href={`/playlists/${playlist.id}`}
                key={playlist.id} 
                className="bg-zinc-900/50 p-4 rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer border border-zinc-800/50 group block"
              >
                <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-md shadow-md">
                  <img 
                    src={playlist.snippet.thumbnails.medium?.url || playlist.snippet.thumbnails.default?.url} 
                    alt={playlist.snippet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-semibold text-white text-base line-clamp-1 mb-1">
                  {playlist.snippet.title}
                </h3>
                <p className="text-zinc-400 text-sm">
                  {playlist.contentDetails.itemCount} tracks
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}