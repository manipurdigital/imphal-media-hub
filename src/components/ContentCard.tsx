import { useState, useRef, useCallback, useEffect } from 'react';
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
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Add small delay to prevent accidental triggers
    setTimeout(() => setIsHovered(true), 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className="relative min-w-[200px] md:min-w-[250px] transform-gpu will-change-transform"
      style={{ isolation: 'isolate' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl transform-gpu will-change-transform">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 ease-out"
          style={{
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'center center'
          }}
        />
        
        {/* Overlay on hover */}
        {isHovered && (
          <div 
            className="absolute inset-0 bg-black/60 flex items-center justify-center"
            style={{
              animation: 'fade-in 0.2s ease-out forwards',
              pointerEvents: 'auto'
            }}
          >
            <button 
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-3 hover:bg-white/30 transition-colors duration-200"
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

      {/* Content Info - Shows on hover with stable positioning */}
      {isHovered && (
        <div 
          className="absolute top-full left-0 right-0 bg-card border border-border rounded-b-xl p-4 z-30 shadow-[var(--card-shadow)]"
          style={{
            animation: 'scale-in 0.2s ease-out forwards',
            transformOrigin: 'top center',
            pointerEvents: 'auto'
          }}
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
                className="bg-primary rounded-full p-2 hover:bg-primary/80 transition-colors duration-200"
                onClick={() => setIsVideoPlayerOpen(true)}
              >
                <Play className="w-4 h-4 text-primary-foreground" />
              </button>
              <button 
                className="bg-secondary/50 rounded-full p-2 hover:bg-secondary/70 transition-colors duration-200"
                onClick={() => {
                  console.log(`Added ${title} to My List`);
                  // TODO: Implement add to list functionality
                }}
              >
                <Plus className="w-4 h-4 text-secondary-foreground" />
              </button>
              <button 
                className="bg-secondary/50 rounded-full p-2 hover:bg-secondary/70 transition-colors duration-200"
                onClick={() => {
                  console.log(`Liked ${title}`);
                  // TODO: Implement like functionality
                }}
              >
                <ThumbsUp className="w-4 h-4 text-secondary-foreground" />
              </button>
            </div>
            
            <button className="bg-secondary/50 rounded-full p-2 hover:bg-secondary/70 transition-colors duration-200">
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