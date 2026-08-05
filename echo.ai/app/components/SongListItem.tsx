// app/components/SongListItem.tsx
import { Play } from "lucide-react";

interface SongListItemProps {
  video: any;
  index: number;
  onClick: () => void;
}

export default function SongListItem({ video, index, onClick }: SongListItemProps) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-md hover:bg-zinc-800/50 cursor-pointer group transition-colors"
    >
      <div className="w-8 text-center text-zinc-500 text-sm group-hover:hidden">
        {index + 1}
      </div>
      <div className="w-8 flex justify-center hidden group-hover:flex">
        <Play size={16} className="text-white fill-white" />
      </div>
      <img 
        src={video.snippet.thumbnails.default.url} 
        alt="thumbnail" 
        className="w-10 h-10 object-cover rounded"
      />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-white font-medium line-clamp-1">{video.snippet.title}</span>
        <span className="text-zinc-400 text-sm line-clamp-1">{video.snippet.channelTitle}</span>
      </div>
    </div>
  );
}