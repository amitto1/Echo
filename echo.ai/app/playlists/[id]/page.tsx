// app/playlists/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ListMusic } from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import SongListItem from "@/app/components/SongListItem";

export default function PlaylistDetailsPage() {
  const params = useParams();
  const playlistId = params.id; // Grabs the ID right out of the URL!

  const { data: session, status } = useSession();
  const playSong = usePlayerStore((state) => state.playSong);

  const [songs, setSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlaylistSongs = async () => {
      if (status !== "authenticated" || !(session as any)?.accessToken || !playlistId) return;

      setIsLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

        // Ask Express for this specific playlist's songs
        const response = await fetch(`${backendUrl}/api/library/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${(session as any)?.accessToken}`,
          }
        });

        const data = await response.json();

        if (response.ok && data.items) {
          setSongs(data.items);
        } else {
          setError(data.error || "Failed to load playlist songs.");
        }
      } catch (err) {
        setError("Network error connecting to backend.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylistSongs();
  }, [playlistId, session, status]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/40 to-zinc-900/40 border border-zinc-800 rounded-2xl p-8 shadow-sm max-w-5xl flex items-end gap-6 h-48">
        <div className="w-32 h-32 bg-zinc-800 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
          <ListMusic size={48} className="text-zinc-500" />
        </div>
        <div className="pb-2">
          <p className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Playlist</p>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Playlist Songs</h1>
          <p className="text-zinc-400 text-sm font-medium">
            {songs.length > 0 ? `${songs.length} tracks` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Songs List */}
      <div className="w-full max-w-5xl mt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        )}

        {!isLoading && !error && songs.length > 0 && (
          <div className="flex flex-col">
            {songs.map((item, index) => {
              // YouTube structures playlist items slightly differently than search results,
              // so we "normalize" it here so your Player understands it!
              const normalizedVideo = {
                id: item.snippet.resourceId.videoId,
                snippet: item.snippet
              };

              return (
                <SongListItem
                  key={item.id}
                  video={normalizedVideo}
                  index={index}
                  onClick={() => playSong(normalizedVideo, songs.map(s => ({
                    id: s.snippet.resourceId.videoId,
                    snippet: s.snippet
                  })))}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}