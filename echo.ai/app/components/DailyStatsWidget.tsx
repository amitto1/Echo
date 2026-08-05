// app/components/DailyStatsWidget.tsx
"use client";

import { useEffect, useRef } from "react";
import { useStatsStore } from "../store/useStatsStore";
import { Flame, Clock, Trophy, Award, X } from "lucide-react";

interface DailyStatsWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyStatsWidget({ isOpen, onClose }: DailyStatsWidgetProps) {
  const secondsToday = useStatsStore((state) => state.secondsToday);
  const streakDays = useStatsStore((state) => state.streakDays);
  const getBadges = useStatsStore((state) => state.getBadges);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when pressing Escape or clicking outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minutesToday = Math.floor(secondsToday / 60);
  const badges = getBadges();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-gradient-to-br from-zinc-900 via-purple-950/40 to-zinc-900 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-full transition-colors cursor-pointer"
          aria-label="Close Stats"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pr-8">
          <div className="flex items-center gap-2.5">
            <Award className="text-purple-400" size={26} />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Daily Audio Stats
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Flame size={16} className="fill-orange-400 animate-pulse" />
            <span>{streakDays} Day Streak</span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl text-purple-400">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Minutes Today</p>
              <p className="text-2xl font-black text-white">{minutesToday} min</p>
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-600/20 rounded-xl text-yellow-400">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Badges Unlocked</p>
              <p className="text-2xl font-black text-white">
                {badges.filter((b) => b.unlocked).length} / {badges.length}
              </p>
            </div>
          </div>
        </div>

        {/* Achievements Badges */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Achievements
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  badge.unlocked
                    ? "bg-purple-900/30 border-purple-500/40 text-white shadow-lg shadow-purple-900/20"
                    : "bg-zinc-950/40 border-zinc-800/60 text-zinc-500 opacity-50"
                }`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs font-bold">{badge.name}</span>
                <span className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                  {badge.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}