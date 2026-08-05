// app/components/GlobalPlayer.tsx
"use client";

import { usePlayer } from "../context/PlayerContext";
import Player from "./Player";

export default function GlobalPlayer() {
  const { currentVideo, setCurrentVideo } = usePlayer();

  if (!currentVideo) return null;

  return <Player/>;
}