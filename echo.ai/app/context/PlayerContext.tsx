// app/context/PlayerContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PlayerContextType {
  searchResults: any[];
  isLoading: boolean;
  currentVideo: any | null;
  setCurrentVideo: (video: any) => void;
  handleSearch: (query: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<any | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/search?q=${searchQuery}`);
      const data = await response.json();
      if (data.items) setSearchResults(data.items);
    } catch (error) {
      console.error("Failed to search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PlayerContext.Provider value={{ searchResults, isLoading, currentVideo, setCurrentVideo, handleSearch }}>
      {children}
    </PlayerContext.Provider>
  );
}

// Custom hook to easily grab this data anywhere
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within a PlayerProvider");
  return context;
};