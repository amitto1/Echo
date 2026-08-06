// app/components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, Search, Library, ListMusic, Plus, Disc3, Music2 } from "lucide-react";
import CreatePlaylistModal from "./CreatePlaylistModal";

const YoutubeIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const mainNav = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Explore", icon: Search, href: "/explore" },
  { name: "Library", icon: Library, href: "/library" },
  { name: "Playlists", icon: ListMusic, href: "/playlists" },
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [customPlaylists, setCustomPlaylists] = useState<any[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAllPlaylists();

    // Listen for global playlist changes across the app
    const handlePlaylistsUpdated = () => {
      fetchAllPlaylists();
    };

    window.addEventListener("playlists-updated", handlePlaylistsUpdated);
    return () => {
      window.removeEventListener("playlists-updated", handlePlaylistsUpdated);
    };
  }, [session, status]);

  const fetchAllPlaylists = async () => {
    if (status !== "authenticated" || !(session as any)?.accessToken) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const userId = (session?.user as any)?.id || session?.user?.email || "default_user";

    try {
      const [customRes, ytRes] = await Promise.all([
        fetch(`${backendUrl}/api/playlists?userId=${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        }),
        fetch(`${backendUrl}/api/library/playlists`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        }),
      ]);

      if (customRes.ok) {
        const customData = await customRes.json();
        if (customData.success) {
          setCustomPlaylists(customData.data);
        }
      }

      if (ytRes.ok) {
        const ytData = await ytRes.json();
        if (ytData.items) {
          setYoutubePlaylists(ytData.items);
        }
      }
    } catch (err) {
      console.error("Failed to load sidebar playlists", err);
    }
  };

  const handlePlaylistCreated = (newPlaylist: any) => {
    setCustomPlaylists((prev) => [newPlaylist, ...prev]);
    window.dispatchEvent(new Event("playlists-updated"));
  };

  return (
    <>
      <aside className="w-[280px] bg-black h-screen p-3 flex flex-col border-r border-zinc-900">
        <div className="flex items-center justify-between mb-8 px-2 mt-2">
          <Link href="/" className="flex items-center gap-2.5">
            <Disc3 className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-white tracking-tighter">
              Echo<span className="text-purple-500">.AI</span>
            </span>
          </Link>
        </div>

        <nav className="space-y-1.5 mb-6">
          {mainNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center gap-4 px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all font-medium"
            >
              <item.icon className="w-5 h-5 group-hover:text-purple-500" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-between px-3 mb-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            Your Playlists
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="text-zinc-600 hover:text-white hover:bg-zinc-900 p-1 rounded-md transition-colors cursor-pointer"
            title="Create Playlist"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {status !== "authenticated" ? (
            <p className="text-xs text-zinc-600 text-center py-4 px-4 bg-zinc-950 rounded-lg border border-dashed border-zinc-800 mx-2">
              Log in to see your playlists.
            </p>
          ) : customPlaylists.length === 0 && youtubePlaylists.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4 px-4 bg-zinc-950 rounded-lg border border-dashed border-zinc-800 mx-2">
              No playlists found.
            </p>
          ) : (
            <>
              {customPlaylists.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-purple-400 px-3 uppercase tracking-widest">
                    Echo Playlists
                  </span>
                  {customPlaylists.map((playlist) => {
                    const id = playlist._id || playlist.id;
                    const name = playlist.title || playlist.name || "Untitled Playlist";

                    return (
                      <Link
                        key={`custom-${id}`}
                        href={`/playlists/${id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors text-sm group"
                      >
                        <div className="w-8 h-8 rounded bg-purple-950/60 border border-purple-800/40 flex-shrink-0 flex items-center justify-center">
                          <Music2 size={16} className="text-purple-400" />
                        </div>
                        <span className="line-clamp-1 group-hover:text-purple-400 transition-colors font-medium">
                          {name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {youtubePlaylists.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-red-500 px-3 uppercase tracking-widest flex items-center gap-1.5">
                    <YoutubeIcon className="w-3 h-3 text-red-500" /> YouTube Playlists
                  </span>
                  {youtubePlaylists.map((playlist) => {
                    const id = playlist.id;
                    const name = playlist.snippet?.title || "YouTube Playlist";
                    const imgUrl = playlist.snippet?.thumbnails?.default?.url;

                    return (
                      <Link
                        key={`yt-${id}`}
                        href={`/playlists/${id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors text-sm group"
                      >
                        <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music2 size={16} className="text-zinc-500" />
                          )}
                        </div>
                        <span className="line-clamp-1 group-hover:text-red-400 transition-colors font-medium">
                          {name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  );
}