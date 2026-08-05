// app/components/Header.tsx
"use client";

import { useState } from "react";
import { User, LogOut, BarChart2 } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import DailyStatsWidget from "./DailyStatsWidget";

export default function Header() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  return (
    <>
      <header className="w-full h-20 flex items-center justify-end px-8 bg-transparent">
        {/* Profile Area */}
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
                <div className="absolute top-12 right-0 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 w-44 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-zinc-800/80 mb-1">
                    <p className="text-xs font-medium text-white line-clamp-1">{session.user.name}</p>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{session.user.email}</p>
                  </div>

                  {/* Audio Stats Option */}
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

                  {/* Sign Out Option */}
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

      {/* Stats Modal Integration */}
      <DailyStatsWidget isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
    </>
  );
}