// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header"; 
import { Providers } from "./components/Providers"; 
import Player from "./components/Player";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Echo.AI - The Intelligent YouTube Music Player",
  description: "A Spotify clone powered by YouTube Music API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            
            {/* Sidebar */}
            <div className="relative z-40 hidden md:block"> 
              <Sidebar />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative">
              <div className="relative z-40">
                <Header /> 
              </div>
              
              <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
                {children}
              </main>
            </div>
            
          </div>

          {/* Moved inside Providers so useSession() and PlayerContext work seamlessly! */}
          <Player />
        </Providers>
      </body>
    </html>
  );
}