import { create } from 'zustand';

interface PlayerStore {
  queue: any[];
  currentIndex: number;
  isLooping: boolean;
  isShuffled: boolean;
  currentTrack: any | null;
  
  // Actions
  playSong: (video: any, newQueue?: any[]) => void;
  setQueue: (tracks: any[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
  toggleLoop: () => void;
  toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  queue: [],
  currentIndex: -1,
  isLooping: false,
  isShuffled: false,
  currentTrack: null,

  playSong: (video, newQueue) => set((state) => {
    if (newQueue) {
      const index = newQueue.findIndex((v) => 
        (typeof v.id === 'string' ? v.id : v.id?.videoId) === 
        (typeof video.id === 'string' ? video.id : video.id?.videoId)
      );
      const newIndex = index !== -1 ? index : 0;
      return { 
        queue: newQueue, 
        currentIndex: newIndex,
        currentTrack: newQueue[newIndex] || null
      };
    }
    return { 
      queue: [video], 
      currentIndex: 0,
      currentTrack: video 
    };
  }),

  setQueue: (tracks) => set({ 
    queue: tracks, 
    currentIndex: tracks.length > 0 ? 0 : -1,
    currentTrack: tracks.length > 0 ? tracks[0] : null
  }),

  playNext: () => set((state) => {
    if (state.queue.length === 0) return state;
    if (state.isLooping) {
      return { currentIndex: state.currentIndex, currentTrack: state.queue[state.currentIndex] };
    }
    if (state.isShuffled && state.queue.length > 1) {
      let randomIndex = Math.floor(Math.random() * state.queue.length);
      while (randomIndex === state.currentIndex) {
        randomIndex = Math.floor(Math.random() * state.queue.length);
      }
      return { currentIndex: randomIndex, currentTrack: state.queue[randomIndex] };
    }
    if (state.currentIndex < state.queue.length - 1) {
      const nextIndex = state.currentIndex + 1;
      return { currentIndex: nextIndex, currentTrack: state.queue[nextIndex] };
    }
    return state;
  }),

  playPrevious: () => set((state) => {
    if (state.currentIndex > 0) {
      const prevIndex = state.currentIndex - 1;
      return { currentIndex: prevIndex, currentTrack: state.queue[prevIndex] };
    }
    return state;
  }),

  // cache bust

  clearQueue: () => set({ queue: [], currentIndex: -1, currentTrack: null }),

  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
}));