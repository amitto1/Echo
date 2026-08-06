"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, LogOut, BarChart2, Search, X, Music2, Play } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import DailyStatsWidget from "./DailyStatsWidget";
import { usePlayer } from "../context/PlayerContext"; // Match your exact path to PlayerContext

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Grab setCurrentVideo from PlayerContext
  const { setCurrentVideo } = usePlayer();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [textSuggestions, setTextSuggestions] = useState<string[]>([]);
  const [richSuggestions, setRichSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const hasSearchedRef = useRef(false);
  const isExplorePage = pathname?.startsWith("/explore");
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (hasSearchedRef.current) return;

    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      setTextSuggestions([]);
      setRichSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (hasSearchedRef.current) return;
      try {
        const res = await fetch(`${backendUrl}/api/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setTextSuggestions(data.textSuggestions || []);
        setRichSuggestions(data.richSuggestions || []);
        if (!hasSearchedRef.current && ((data.textSuggestions && data.textSuggestions.length > 0) || (data.richSuggestions && data.richSuggestions.length > 0))) {
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
        setTextSuggestions([]);
        setRichSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, backendUrl]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    
    hasSearchedRef.current = true;
    setShowSuggestions(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSelectTerm = (term: string) => {
    setSearchQuery(term);
    hasSearchedRef.current = true;
    setShowSuggestions(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleSelectRichItem = (item: any) => {
    hasSearchedRef.current = true;
    setShowSuggestions(false);
    setSearchQuery("");
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Standardize object structure to match Player requirements
    const formattedItem = {
      id: item.id,
      snippet: {
        title: item.title,
        channelTitle: item.artist,
        thumbnails: {
          default: { url: item.thumbnail },
          high: { url: item.thumbnail },
        }
      }
    };

    setCurrentVideo(formattedItem);
  };

  return (
    <>
      <header className="w-full h-20 flex items-center justify-between px-8 bg-transparent relative z-40">
        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          {!isExplorePage && (
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => {
                  hasSearchedRef.current = false;
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 2) {
                    setShowSuggestions(true);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (!hasSearchedRef.current && searchQuery.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                className={`w-full bg-zinc-900 border ${showSuggestions ? 'border-zinc-700 rounded-t-2xl rounded-b-none' : 'border-zinc-800 rounded-full'} pl-11 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-all shadow-xl`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    hasSearchedRef.current = false;
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </form>
          )}

          {showSuggestions && (textSuggestions.length > 0 || richSuggestions.length > 0) && (
            <div className="absolute left-0 right-0 bg-zinc-950 border-x border-b border-zinc-800 rounded-b-2xl shadow-2xl py-3 z-50 max-h-[70vh] overflow-y-auto">
              {textSuggestions.map((term, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTerm(term)}
                  className="w-full flex items-center gap-3.5 px-4 py-2.5 text-left hover:bg-zinc-900/80 transition-colors text-zinc-300 hover:text-white group cursor-pointer"
                >
                  <Search size={16} className="text-zinc-500 group-hover:text-purple-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{term}</span>
                </button>
              ))}

              {textSuggestions.length > 0 && richSuggestions.length > 0 && (
                <div className="my-2 border-t border-zinc-900" />
              )}

              {richSuggestions.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => handleSelectRichItem(item)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-900/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-md bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music2 size={16} className="text-zinc-500" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={16} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate group-hover:text-purple-400">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        Song • {item.artist}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end min-w-[120px]">
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-zinc-800 animate-pulse"></div>
          ) : status === "authenticated" && session.user ? (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center focus:outline-none"
              >
                <img 
                  src={session.user.image || `https://api.dicebear.com/8.x/initials/svg?seed=${session.user.name}`} 
                  alt="Profile" 
                  referrerPolicy="no-referrer" 
                  className="w-9 h-9 rounded-full border border-zinc-700 cursor-pointer hover:border-purple-500 transition-colors shadow-md"
                />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-12 right-0 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 w-44 z-50">
                  <div className="px-4 py-2 border-b border-zinc-800/80 mb-1">
                    <p className="text-xs font-medium text-white line-clamp-1">{session.user.name}</p>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{session.user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsStatsOpen(true);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  >
                    <BarChart2 size={16} className="mr-2.5 text-purple-400" />
                    Audio Stats
                  </button>

                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      signOut();
                    }} 
                    className="w-full flex items-center px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer mt-1"
                  >
                    <LogOut size={16} className="mr-2.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => signIn("google")} 
              className="h-9 px-4 flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-200 transition-colors text-black font-semibold text-sm shadow-md cursor-pointer"
            >
              <User size={16} />
              Sign In
            </button>
          )}
        </div>
      </header>

      <DailyStatsWidget isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </>
  );
}