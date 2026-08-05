// app/components/Providers.tsx
"use client"; 

import { SessionProvider } from "next-auth/react";
import { PlayerProvider } from "../context/PlayerContext"; // <-- Import it

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </SessionProvider>
  );
}