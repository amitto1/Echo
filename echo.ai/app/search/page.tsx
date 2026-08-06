"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Music2, Play } from "lucide-react";
import { usePlayer } from "../context/PlayerContext"; // Match your exact path to PlayerContext

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const { setCurrentVideo } = usePlayer();

  useEffect(() => {
    if (!query) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Search fetch error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, backendUrl]);

  const handlePlay = (item: any) => {
    setCurrentVideo(item);
  };

  return (
    <div className="p-8 text-white min-h-screen pb-32 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for <span className="text-purple-400">"{query}"</span>
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 bg-zinc-900/40 p-3 rounded-xl animate-pulse">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-zinc-500">No results found for "{query}".</p>
      ) : (
        <div className="flex flex-col space-y-1">
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold text-zinc-400 border-b border-zinc-800 mb-2">
            <div className="col-span-8 md:col-span-9">Title</div>
            <div className="col-span-4 md:col-span-3 text-right">Action</div>
          </div>

          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handlePlay(item)}
              className="grid grid-cols-12 items-center px-4 py-2.5 rounded-xl hover:bg-zinc-900/80 transition-colors group cursor-pointer"
            >
              <div className="col-span-8 md:col-span-9 flex items-center gap-3.5 min-w-0">
                <div className="relative w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Music2 size={20} className="text-zinc-600" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={18} fill="white" className="text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {item.artist}
                  </p>
                </div>
              </div>

              <div className="col-span-4 md:col-span-3 flex items-center justify-end">
                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors px-3 py-1 rounded-full border border-zinc-800 group-hover:border-purple-500 group-hover:bg-purple-600/20">
                  Play
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}