// store/usePlayerStore.ts
import { create } from 'zustand';

interface PlayerStore {
  queue: any[];
  currentIndex: number;
  isLooping: boolean;
  isShuffled: boolean;
  
  // Actions
  playSong: (video: any, newQueue?: any[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isLooping: false,
  isShuffled: false,

  playSong: (video, newQueue) => set((state) => {
    if (newQueue) {
      const index = newQueue.findIndex((v) => 
        (typeof v.id === 'string' ? v.id : v.id?.videoId) === 
        (typeof video.id === 'string' ? video.id : video.id?.videoId)
      );
      return { queue: newQueue, currentIndex: index !== -1 ? index : 0 };
    }
    return { queue: [video], currentIndex: 0 };
  }),

  playNext: () => set((state) => {
    if (state.queue.length === 0) return state;

    // Loop mode: replay the current song
    if (state.isLooping) {
      return { currentIndex: state.currentIndex };
    }

    // Shuffle mode: pick a random index from the queue
    if (state.isShuffled && state.queue.length > 1) {
      let randomIndex = Math.floor(Math.random() * state.queue.length);
      // Avoid picking the exact same song if queue > 1
      while (randomIndex === state.currentIndex) {
        randomIndex = Math.floor(Math.random() * state.queue.length);
      }
      return { currentIndex: randomIndex };
    }

    // Normal sequential playback
    if (state.currentIndex < state.queue.length - 1) {
      return { currentIndex: state.currentIndex + 1 };
    }

    return state; // End of queue
  }),

  playPrevious: () => set((state) => {
    if (state.currentIndex > 0) {
      return { currentIndex: state.currentIndex - 1 };
    }
    return state;
  }),

  clearQueue: () => set({ queue: [], currentIndex: -1 }),

  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
}));