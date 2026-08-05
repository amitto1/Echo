// store/useStatsStore.ts
import { create } from "zustand";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface StatsState {
  secondsToday: number;
  streakDays: number;
  isLoading: boolean;
  fetchStats: (userId: string) => Promise<void>;
  tickTime: (userId: string, addedSecs?: number) => Promise<void>;
  getBadges: () => { id: string; name: string; icon: string; description: string; unlocked: boolean }[];
}

export const useStatsStore = create<StatsState>((set, get) => ({
  secondsToday: 0,
  streakDays: 1,
  isLoading: false,

  // Fetch initial stats from MongoDB
  fetchStats: async (userId: string) => {
    if (!userId) return;
    set({ isLoading: true });
    try {
      const res = await axios.get(`${BACKEND_URL}/api/user/data?userId=${encodeURIComponent(userId)}`);
      set({
        secondsToday: res.data.secondsToday || 0,
        streakDays: res.data.streakDays || 1,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch user stats", err);
      set({ isLoading: false });
    }
  },

  // Sync listening time to backend every 5 seconds
  tickTime: async (userId: string, addedSecs = 5) => {
    if (!userId) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/api/user/stats/tick`, {
        userId,
        addedSeconds: addedSecs,
      });
      set({
        secondsToday: res.data.secondsToday,
        streakDays: res.data.streakDays,
      });
    } catch (err) {
      console.error("Failed to sync stats tick", err);
    }
  },

  // Dynamic achievement badge calculations
  getBadges: () => {
    const minutes = Math.floor(get().secondsToday / 60);
    const streak = get().streakDays;

    return [
      {
        id: "starter",
        name: "First Beat",
        icon: "🎵",
        description: "Listen for 1 minute today",
        unlocked: minutes >= 1,
      },
      {
        id: "focus",
        name: "Focus Mode",
        icon: "🎧",
        description: "Listen for 15 minutes today",
        unlocked: minutes >= 15,
      },
      {
        id: "marathon",
        name: "Audio Marathon",
        icon: "⚡",
        description: "Listen for 60 minutes today",
        unlocked: minutes >= 60,
      },
      {
        id: "streak_3",
        name: "On Fire",
        icon: "🔥",
        description: "Maintain a 3-day listening streak",
        unlocked: streak >= 3,
      },
    ];
  },
}));