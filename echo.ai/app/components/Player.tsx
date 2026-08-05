// app/components/Player.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, 
  ChevronDown, ChevronUp, Repeat, Shuffle 
} from "lucide-react";
import YouTube from "react-youtube";

// Imports matching your actual folder layout
import { usePlayer } from "../context/PlayerContext";
import { usePlayerStore } from "../store/usePlayerStore";
import { useStatsStore } from "../store/useStatsStore";
import { useSession } from "next-auth/react";

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const date = new Date(seconds * 1000);
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2, "0");
  const hh = date.getUTCHours();
  if (hh > 0) return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
  return `${mm}:${ss}`;
};

export default function Player() {
  const { data: session } = useSession();
  const userId = session?.user?.email || "guest";

  // Context hook for current video
  const { currentVideo } = usePlayer();

  // Zustand Store for Queue & Controls
  const { 
    queue, currentIndex, playNext, playPrevious, clearQueue,
    isLooping, isShuffled, toggleLoop, toggleShuffle 
  } = usePlayerStore();

  const { tickTime, fetchStats } = useStatsStore();
  
  const [player, setPlayer] = useState<any>(null);
  
  // UI & Volume States
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedRatio, setPlayedRatio] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [prevVolume, setPrevVolume] = useState(80);
  const [isSeeking, setIsSeeking] = useState(false);
  
  // Full Screen & Mode States
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const activeVideo = currentVideo || queue?.[currentIndex];
  const videoId = activeVideo ? (typeof activeVideo.id === 'string' ? activeVideo.id : activeVideo.id?.videoId) : null;

  // Initial fetch of user stats
  useEffect(() => {
    if (userId) {
      fetchStats(userId);
    }
  }, [userId, fetchStats]);

  // Syncs listening time every 5s while playing
  useEffect(() => {
    if (!isPlaying || !userId) return;

    const statsInterval = setInterval(() => {
      tickTime(userId, 5);
    }, 5000);

    return () => clearInterval(statsInterval);
  }, [isPlaying, userId, tickTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && player && !isSeeking) {
      interval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const dur = player.getDuration();
        if (dur > 0) {
          setDuration(dur);
          setPlayedSeconds(currentTime);
          setPlayedRatio(currentTime / dur);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player, isSeeking]);

  if (!videoId || !activeVideo) return null;

  const title = activeVideo.snippet?.title || "Unknown Title";
  const channel = activeVideo.snippet?.channelTitle || "Unknown Artist";
  const defaultThumbnail = activeVideo.snippet?.thumbnails?.default?.url || `https://api.dicebear.com/8.x/shapes/svg?seed=${title}`;
  const highResThumbnail = activeVideo.snippet?.thumbnails?.high?.url || defaultThumbnail;

  const onReady = (event: any) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);
    ytPlayer.setVolume(volume);
    ytPlayer.playVideo();
  };

  const onStateChange = (event: any) => {
    if (event.data === 1) setIsPlaying(true);
    else if (event.data === 2) setIsPlaying(false);
    else if (event.data === 0) {
      setIsPlaying(false);
      if (isLooping && player) {
        player.seekTo(0);
        player.playVideo();
      } else {
        playNext();
      }
    }
  };

  const handleTogglePlay = () => {
    if (!player) return;
    if (isPlaying) player.pauseVideo();
    else player.playVideo();
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRatio = parseFloat(e.target.value);
    setPlayedRatio(newRatio);
    setPlayedSeconds(newRatio * duration);
  };

  const handleSeekMouseDown = () => setIsSeeking(true);

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    if (player && duration > 0) {
      const newRatio = parseFloat((e.target as HTMLInputElement).value);
      player.seekTo(newRatio * duration, true); 
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value);
    setVolume(newVol);
    if (player) player.setVolume(newVol);
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (player) player.setVolume(0);
    } else {
      const restoredVol = prevVolume > 0 ? prevVolume : 80;
      setVolume(restoredVol);
      if (player) player.setVolume(restoredVol);
    }
  };

  const hasNext = currentIndex < (queue?.length || 0) - 1 || isShuffled || isLooping;
  const hasPrevious = currentIndex > 0;

  return (
    <>
      {/* 1. EXPANDED "NOW PLAYING" OVERLAY */}
      {isExpanded && (
        <div className="fixed inset-0 bg-zinc-950 z-40 flex flex-col items-center justify-center animate-in slide-in-from-bottom-8 duration-500 pb-[90px]">
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
            <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-zinc-800 rounded-full text-white transition">
              <ChevronDown size={28} />
            </button>
            <div className="bg-zinc-900 rounded-full p-1 border border-zinc-800 flex items-center shadow-lg">
              <button
                onClick={() => setShowVideo(false)}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${!showVideo ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                Song
              </button>
              <button
                onClick={() => setShowVideo(true)}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${showVideo ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
              >
                Video
              </button>
            </div>
            <div className="w-11"></div>
          </div>
          <div className="w-full max-w-5xl px-8 flex items-center justify-center aspect-video relative">
            {!showVideo && (
              <img src={highResThumbnail} alt="Cover Art" className="h-full aspect-square max-h-[60vh] object-cover rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500" />
            )}
          </div>
        </div>
      )}

      {/* YOUTUBE PLAYER ENGINE */}
      <div 
        className={
          isExpanded && showVideo 
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+45px)] w-[90vw] max-w-5xl aspect-video bg-black rounded-xl shadow-2xl z-40 overflow-hidden pointer-events-none animate-in fade-in zoom-in-95 duration-500" 
            : "fixed top-0 left-0 w-10 h-10 -z-10 opacity-0 pointer-events-none overflow-hidden"
        }
      >
        <YouTube
          videoId={videoId}
          onReady={onReady}
          onStateChange={onStateChange}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: { autoplay: 1, controls: 0, disablekb: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, fs: 0, playsinline: 1 },
          }}
          className="w-full h-full scale-[1.2]" 
        />
      </div>

      {/* BOTTOM PLAYBAR */}
      <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-zinc-950 border-t border-zinc-900 flex items-center justify-between px-4 md:px-6 z-50 animate-in slide-in-from-bottom-2 duration-300">
        
        {/* Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-[180px]">
          <button onClick={() => setIsExpanded(!isExpanded)} className="group relative w-14 h-14 rounded-md overflow-hidden shadow-md border border-zinc-800 flex-shrink-0">
            <img src={defaultThumbnail} alt="Cover Art" className="w-full h-full object-cover transition duration-300 group-hover:brightness-50" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isExpanded ? <ChevronDown size={24} className="text-white" /> : <ChevronUp size={24} className="text-white" />}
            </div>
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-semibold text-sm line-clamp-1">{title}</span>
            <span className="text-zinc-400 text-xs line-clamp-1 mt-0.5">{channel}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center w-1/3 max-w-md gap-2">
          <div className="flex items-center gap-5">
            <button 
              onClick={toggleShuffle} 
              className={`transition ${isShuffled ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>

            <button 
              onClick={playPrevious} 
              disabled={!hasPrevious}
              className={`transition ${hasPrevious ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 cursor-not-allowed'}`}
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            
            <button onClick={handleTogglePlay} className="w-8 h-8 flex items-center justify-center bg-white rounded-full hover:scale-105 transition shadow-lg">
              {isPlaying ? <Pause size={16} className="text-black fill-black" /> : <Play size={16} className="text-black fill-black ml-0.5" />}
            </button>
            
            <button 
              onClick={playNext} 
              disabled={!hasNext}
              className={`transition ${hasNext ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 cursor-not-allowed'}`}
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            <button 
              onClick={toggleLoop} 
              className={`transition ${isLooping ? 'text-purple-500 hover:text-purple-400' : 'text-zinc-500 hover:text-white'}`}
              title="Loop"
            >
              <Repeat size={18} />
            </button>
          </div>
          
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-medium w-8 text-right">{formatTime(playedSeconds)}</span>
            <input type="range" min={0} max={1} step="any" value={playedRatio} onMouseDown={handleSeekMouseDown} onChange={handleSeekChange} onMouseUp={handleSeekMouseUp} className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all" />
            <span className="text-[10px] text-zinc-500 font-medium w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Close */}
        <div className="flex items-center justify-end gap-3 w-1/3 min-w-[180px] text-zinc-400">
          <button onClick={handleToggleMute} className="hover:text-white transition">
            {volume === 0 ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range" 
            min={0} 
            max={100} 
            value={volume} 
            onChange={handleVolumeChange} 
            className="w-20 md:w-24 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all hidden md:block" 
          />
          <button onClick={clearQueue} className="hover:text-white transition ml-2 p-2 hover:bg-zinc-900 rounded-full" title="Close player">
            <X size={18} />
          </button>
        </div>

      </div>
    </>
  );
}