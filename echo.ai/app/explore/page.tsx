// app/explore/page.tsx
"use client";

import { useState } from "react";
import AiVibeGenerator from "@/app/components/AiVibeGenerator";
import { usePlayerStore } from "../store/usePlayerStore";
import { Play, Music } from "lucide-react";

export default function ExplorePage() {
  const queue = usePlayerStore((state) => state.queue);
  const playSong = usePlayerStore((state) => state.playSong);

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
              const videoId = typeof track.id === "string" ? track.id : track.id?.videoId;

              return (
                <div
                  key={videoId || idx}
                  onClick={() => playSong(track, queue)}
                  className="group flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-6 text-center text-zinc-500 text-sm font-semibold group-hover:text-purple-400">
                      {idx + 1}
                    </span>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img
                        src={track.snippet?.thumbnails?.default?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play size={16} className="text-white fill-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm line-clamp-1 text-white group-hover:text-purple-400 transition-colors">
                        {track.snippet?.title}
                      </h3>
                      <p className="text-zinc-500 text-xs truncate mt-0.5">
                        {track.snippet?.channelTitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}