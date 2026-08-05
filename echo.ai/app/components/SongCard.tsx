// 1. Define the TypeScript "Props"
interface SongCardProps {
  video: any;
  onClick: () => void;
}

// 2. Build the Component
export default function SongCard({ video, onClick }: SongCardProps) {
  return (
    <div 
      // WE USE THE PROP HERE!
      onClick={onClick}
      className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800"
    >
      <img 
        src={video.snippet.thumbnails.medium.url} 
        alt={video.snippet.title} 
        className="w-full aspect-video object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1">{video.snippet.title}</h3>
        <p className="text-sm text-zinc-400 mt-1">{video.snippet.channelTitle}</p>
      </div>
    </div>
  );
}