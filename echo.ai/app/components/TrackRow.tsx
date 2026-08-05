// app/components/TrackRow.tsx
"use client";

import { Play, Music } from "lucide-react";

interface TrackRowProps {
  track: any;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}

export default function TrackRow({ track, index, isPlaying, onPlay }: TrackRowProps) {
  return (
    <div
      onClick={onPlay}
      className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
        isPlaying
          ? "bg-purple-950/40 border-purple-500/50"
          : "bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-800/60"
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="w-6 text-center text-zinc-500 text-sm font-semibold group-hover:text-purple-400">
          {index + 1}
        </span>
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
          <img
            src={track.snippet?.thumbnails?.default?.url}
            alt={track.snippet?.title || "Track thumbnail"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Play size={16} className="text-white fill-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-semibold text-sm line-clamp-1 ${isPlaying ? "text-purple-400" : "text-white"}`}>
            {track.snippet?.title}
          </h3>
          <p className="text-zinc-500 text-xs truncate mt-0.5">
            {track.snippet?.channelTitle}
          </p>
        </div>
      </div>

      <div className="text-zinc-500 group-hover:text-purple-400 transition-colors p-2">
        <Music size={18} />
      </div>
    </div>
  );
}