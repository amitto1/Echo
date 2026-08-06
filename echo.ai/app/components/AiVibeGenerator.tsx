"use client";

import { useState } from "react";
import { Sparkles, Loader2, Play, Search, Wand2 } from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore";

export default function AiVibeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"vibe" | "beat">("vibe"); // Toggle state
  const [statusText, setStatusText] = useState("");
  
  const playSong = usePlayerStore((state) => state.playSong);

  // Suggestions for Vibe Search
  const vibeSuggestions = [
    "Lofi beats to focus to",
    "Late night drive vibes",
    "Energetic workout phonk",
    "Chill acoustic coffee shop",
    "Retro synthwave journey",
  ];

  // Suggestions for AI Beat Generation
  const beatSuggestions = [
    "Chill lofi piano beat",
    "80s synthwave cyberpunk driving",
    "Heavy 808 trap beat with flute",
    "Ambient chill synth soundscape",
  ];

  const triggerAction = async (searchQuery: string) => {
    if (!searchQuery.trim() || loading) return;

    setLoading(true);
    setStatusText("");
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

    try {
      if (mode === "vibe") {
        // --- MODE 1: CURATE VIBE (Gemini + YouTube) ---
        setStatusText("Curating playlist...");
        
        const aiRes = await fetch(`${backendUrl}/api/ai/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: searchQuery }),
        });

        const aiData = await aiRes.json();
        const queries: string[] = aiData.queries || [searchQuery];

        const searchRes = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(queries[0])}`);
        const searchData = await searchRes.json();

        if (searchData.items && searchData.items.length > 0) {
          playSong(searchData.items[0], searchData.items);
        } else {
          alert("No tracks found for that vibe. Try another query!");
        }

      } else {
        // --- MODE 2: GENERATE AI BEAT (Hugging Face MusicGen) ---
        setStatusText("Synthesizing AI Beat... (Takes ~15s)");

        const res = await fetch(`${backendUrl}/api/ai/generate-beat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: searchQuery }),
        });

        const data = await res.json();

        if (res.status === 503) {
          alert("The AI model is waking up from a cold start! Please wait 20 seconds and try again.");
          return;
        }

        if (data.success && data.audioUrl) {
          const generatedTrack = {
            id: `ai-beat-${Date.now()}`,
            title: searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1),
            artist: "Echo.AI Studio",
            thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
            audioUrl: data.audioUrl,
            isAiGenerated: true,
          };

          playSong(generatedTrack, [generatedTrack]);
        } else {
          alert("Failed to synthesize beat. Please try another prompt!");
        }
      }
    } catch (err) {
      console.error("Explore action error:", err);
      alert("Something went wrong. Make sure backend is running!");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAction(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    triggerAction(suggestion);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 mb-8">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          {mode === "vibe" ? "What do you want to hear?" : "Synthesize Custom Beat"}
        </h1>
        <p className="text-zinc-400 text-sm md:text-base font-medium">
          {mode === "vibe" 
            ? "Search for songs, artists, or describe a specific vibe."
            : "Describe an instrument, genre, or mood to generate a brand new beat."}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-full shadow-inner">
        <button
          onClick={() => setMode("vibe")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
            mode === "vibe" 
              ? "bg-purple-600 text-white shadow-md" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Search size={15} />
          <span>Vibe Search</span>
        </button>

        <button
          onClick={() => setMode("beat")}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
            mode === "beat" 
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md" 
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Wand2 size={15} />
          <span>AI Beat Studio</span>
        </button>
      </div>

      {/* Main Search/Generate Bar with Purple Glow */}
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
            placeholder={
              mode === "vibe" 
                ? "Ask Echo.AI for a vibe or artist..." 
                : "e.g., Fast rap beat with smooth piano and heavy 808s..."
            }
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
                <span>{statusText || "Processing..."}</span>
              </>
            ) : (
              <>
                {mode === "vibe" ? (
                  <>
                    <Play size={14} className="fill-white" />
                    <span>Generate Vibe</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>Synthesize Beat</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Dynamic Floating Suggestion Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mr-1">
          Suggestions:
        </span>
        {(mode === "vibe" ? vibeSuggestions : beatSuggestions).map((suggestion, index) => (
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