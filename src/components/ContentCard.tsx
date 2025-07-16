import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Play, Plus, ThumbsUp, ChevronDown, Check } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

interface ContentCardProps {
  id: string;
  title: string;
  image: string;
  rating: number;
  year: number;
  genre: string;
  duration: string;
  description?: string;
  videoUrl?: string;
  castMembers?: string[];
  director?: string;
  contentType?: string;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  trailerUrl?: string;
}

const ContentCard = memo(({ 
  id,
  title, 
  image, 
  rating, 
  year, 
  genre, 
  duration, 
  description, 
  videoUrl, 
  castMembers = [], 
  director, 
  contentType, 
  categories = [], 
  trailerUrl 
}: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite, loading: favoritesLoading } = useFavoritesContext();

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
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl transform-gpu will-change-transform border border-border/30">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-all duration-300 ease-out"
          style={{
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'center center'
          }}
        />
        
        {/* Always visible title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 pt-8">
          <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 text-shadow">
            {title}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-gray-300 mt-1">
            <span>{year}</span>
            <span>•</span>
            <span className="flex items-center">
              <span className="text-yellow-400 mr-1">★</span>
              {rating}
            </span>
          </div>
        </div>
        
        {/* Hover overlay for play button */}
        {isHovered && (
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
            style={{
              animation: 'fade-in 0.2s ease-out forwards',
              pointerEvents: 'auto'
            }}
          >
            <button 
              className="glass-morphism rounded-full p-4 interactive-scale hover:glow-effect"
              onClick={() => setIsVideoPlayerOpen(true)}
            >
              <Play className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

        {/* Rating Badge - moved to top right */}
        <div className="absolute top-2 right-2 glass-morphism px-3 py-1 rounded-full text-yellow-400 text-sm font-semibold flex items-center">
          <span className="mr-1">★</span>
          {rating}
        </div>
      </div>

      {/* Content Info - Shows on hover with stable positioning */}
      {isHovered && (
        <div 
          className="absolute top-full left-0 right-0 glass-gradient border border-border/50 rounded-b-xl p-4 z-30 elevated-shadow"
          style={{
            animation: 'slide-down 0.3s ease-out forwards',
            transformOrigin: 'top center',
            pointerEvents: 'auto'
          }}
        >
          <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{title}</h3>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
            <span>{year}</span>
            <span>•</span>
            <span>{genre}</span>
            <span>•</span>
            <span>{duration}</span>
            {contentType && (
              <>
                <span>•</span>
                <span className="capitalize">{contentType}</span>
              </>
            )}
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {categories.slice(0, 3).map((category) => (
                <span 
                  key={category.id} 
                  className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full"
                >
                  {category.name}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="text-xs text-muted-foreground">+{categories.length - 3} more</span>
              )}
            </div>
          )}

          {/* Cast and Director */}
          <div className="space-y-1 mb-3">
            {director && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Director:</span> {director}
              </p>
            )}
            {castMembers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Cast:</span> {castMembers.slice(0, 3).map((member, index) => (
                  <span key={`${id}-cast-${index}`}>
                    {index > 0 && ', '}
                    {member}
                  </span>
                ))}
                {castMembers.length > 3 && <span className="opacity-70"> +{castMembers.length - 3} more</span>}
              </p>
            )}
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
                className="bg-primary rounded-full p-2 transition-all duration-200 interactive-scale glow-effect hover:glow-effect-strong"
                onClick={() => setIsVideoPlayerOpen(true)}
                title="Play video"
              >
                <Play className="w-4 h-4 text-primary-foreground" />
              </button>
              {trailerUrl && (
                <button 
                  className="glass-morphism rounded-full p-2 transition-all duration-200 interactive-scale hover:glow-effect"
                  onClick={() => {
                    console.log(`Playing trailer for ${title}`);
                    // TODO: Implement trailer functionality
                  }}
                  title="Watch trailer"
                >
                  <Play className="w-3 h-3 text-secondary-foreground" />
                </button>
              )}
              <button 
                className="glass-morphism rounded-full p-2 transition-all duration-200 interactive-scale hover:glow-effect"
                onClick={() => toggleFavorite(id)}
                disabled={favoritesLoading}
                title={isFavorite(id) ? "Remove from My List" : "Add to My List"}
              >
                {isFavorite(id) ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Plus className="w-4 h-4 text-secondary-foreground" />
                )}
              </button>
              <button 
                className="glass-morphism rounded-full p-2 transition-all duration-200 interactive-scale hover:glow-effect"
                onClick={() => {
                  console.log(`Liked ${title}`);
                  // TODO: Implement like functionality
                }}
                title="Like this content"
              >
                <ThumbsUp className="w-4 h-4 text-secondary-foreground" />
              </button>
            </div>
            
            <button 
              className="glass-morphism rounded-full p-2 transition-all duration-200 interactive-scale hover:glow-effect"
              title="More options"
            >
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
});

export default ContentCard;