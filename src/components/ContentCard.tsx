import { useState, useRef, useCallback } from 'react';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';

interface ContentCardProps {
  title: string;
  image: string;
  rating: number;
  year: number;
  genre: string;
  duration: string;
  description?: string;
  videoUrl?: string;
}

const ContentCard = ({ title, image, rating, year, genre, duration, description, videoUrl }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);

  return (
    <div 
      className="content-card relative group min-w-[200px] md:min-w-[250px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-fade-in">
            <button 
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-3 hover:bg-white/30 transition-colors"
              onClick={() => setIsVideoPlayerOpen(true)}
            >
              <Play className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-yellow-400 text-sm font-semibold flex items-center">
          <span className="mr-1">★</span>
          {rating}
        </div>
      </div>

      {/* Content Info - Shows on hover */}
      {isHovered && (
        <div 
          className="absolute top-full left-0 right-0 bg-card border border-border rounded-b-xl p-4 z-20 animate-scale-in shadow-[var(--card-shadow)] pointer-events-auto"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{title}</h3>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
            <span>{year}</span>
            <span>•</span>
            <span>{genre}</span>
            <span>•</span>
            <span>{duration}</span>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button 
                className="bg-primary rounded-full p-2 hover:bg-primary/80 transition-colors"
                onClick={() => setIsVideoPlayerOpen(true)}
              >
                <Play className="w-4 h-4 text-primary-foreground" />
              </button>
              <button 
                className="bg-secondary/50 rounded-full p-2 hover:bg-secondary/70 transition-colors"
                onClick={() => {
                  console.log(`Added ${title} to My List`);
                  // TODO: Implement add to list functionality
                }}
              >
                <Plus className="w-4 h-4 text-secondary-foreground" />
              </button>
              <button 
                className="bg-secondary/50 rounded-full p-2 hover:bg-secondary/70 transition-colors"
                onClick={() => {
                  console.log(`Liked ${title}`);
                  // TODO: Implement like functionality
                }}
              >
                <ThumbsUp className="w-4 h-4 text-secondary-foreground" />
              </button>
            </div>
            
            <button className="bg-secondary/50 rounded-full p-2 hover:bg-secondary/70 transition-colors">
              <ChevronDown className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Video Player */}
      <VideoPlayer
        title={title}
        videoUrl={videoUrl}
        isOpen={isVideoPlayerOpen}
        onClose={() => setIsVideoPlayerOpen(false)}
      />
    </div>
  );
};

export default ContentCard;