// app/components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Home, Search, Library, ListMusic, Plus, Disc3, Music2 } from "lucide-react";

const mainNav = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Explore", icon: Search, href: "/explore" },
  { name: "Library", icon: Library, href: "/library" },
  { name: "Playlists", icon: ListMusic, href: "/playlists" },
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    const fetchSidebarPlaylists = async () => {
      if (status !== "authenticated" || !(session as any)?.accessToken) return;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
        const response = await fetch(`${backendUrl}/api/library/playlists`, {
          headers: { Authorization: `Bearer ${(session as any)?.accessToken}` },
        });
        const data = await response.json();
        if (response.ok && data.items) {
          setPlaylists(data.items);
        }
      } catch (err) {
        console.error("Failed to load sidebar playlists", err);
      }
    };

    fetchSidebarPlaylists();
  }, [session, status]);

  return (
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
          <Link key={item.name} href={item.href} className="group flex items-center gap-4 px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all font-medium">
            <item.icon className="w-5 h-5 group-hover:text-purple-500" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center justify-between px-3 mb-3">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Your Playlists</h2>
        <Link href="/playlists" className="text-zinc-600 hover:text-white hover:bg-zinc-900 p-1 rounded-md transition-colors">
          <Plus size={20} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 px-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {status !== "authenticated" ? (
          <p className="text-xs text-zinc-600 text-center py-4 px-4 bg-zinc-950 rounded-lg border border-dashed border-zinc-800 mx-2">
            Log in to see your playlists.
          </p>
        ) : playlists.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4 px-4 bg-zinc-950 rounded-lg border border-dashed border-zinc-800 mx-2 animate-pulse">
            Loading playlists...
          </p>
        ) : (
          playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors text-sm group"
            >
              <div className="w-8 h-8 rounded bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {playlist.snippet?.thumbnails?.default?.url ? (
                  <img src={playlist.snippet.thumbnails.default.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music2 size={16} className="text-zinc-500" />
                )}
              </div>
              <span className="line-clamp-1 group-hover:text-purple-400 transition-colors font-medium">
                {playlist.snippet.title}
              </span>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}