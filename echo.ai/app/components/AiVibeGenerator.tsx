// app/components/AiVibeGenerator.tsx
"use client";

import { useState } from "react";
import { Sparkles, Loader2, Play, Search } from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore";

export default function AiVibeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const playSong = usePlayerStore((state) => state.playSong);

  // Preset vibe suggestions
  const vibeSuggestions = [
    "Lofi beats to focus to",
    "Late night drive vibes",
    "Energetic workout phonk",
    "Chill acoustic coffee shop",
    "Retro synthwave journey",
  ];

  const triggerSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || loading) return;

    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

      // 1. Fetch AI song queries
      const aiRes = await fetch(`${backendUrl}/api/ai/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: searchQuery }),
      });

      const aiData = await aiRes.json();
      const queries: string[] = aiData.queries || [searchQuery];

      // 2. Search YouTube using top AI query
      const searchRes = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(queries[0])}`);
      const searchData = await searchRes.json();

      if (searchData.items && searchData.items.length > 0) {
        playSong(searchData.items[0], searchData.items);
      } else {
        alert("No tracks found for that vibe. Try another query!");
      }
    } catch (err) {
      console.error("Failed to generate vibe:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    triggerSearch(suggestion);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 mb-8">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          What do you want to hear?
        </h1>
        <p className="text-zinc-400 text-sm md:text-base font-medium">
          Search for songs, artists, or describe a specific vibe.
        </p>
      </div>

      {/* Main AI Search Bar with Purple Glow */}
      <div className="relative w-full group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 rounded-full blur-md opacity-35 group-hover:opacity-75 transition-all duration-500"></div>

        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-zinc-950/90 border border-purple-500/30 group-hover:border-purple-500/70 rounded-full px-5 py-3.5 shadow-2xl transition-all"
        >
          <div className="flex items-center gap-3 text-purple-400 mr-3">
            <Sparkles size={22} className="animate-pulse" />
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Echo.AI for a vibe or artist..."
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm md:text-base focus:outline-none pr-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-full text-xs md:text-sm transition-all shadow-lg flex-shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Curating...</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-white" />
                <span>Generate Vibe</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Floating AI Suggestion Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mr-1">
          Suggestions:
        </span>
        {vibeSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="bg-zinc-900/80 hover:bg-purple-900/40 border border-zinc-800 hover:border-purple-500/50 text-zinc-300 hover:text-white px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>

    </div>
  );
}