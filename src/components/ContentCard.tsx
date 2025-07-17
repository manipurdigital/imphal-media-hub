import React, { useState } from 'react';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

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

const ContentCard: React.FC<ContentCardProps> = ({
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
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const handleClick = () => {
    if (videoUrl) {
      setShowPlayer(true);
    }
  };

  return (
    <>
      <div 
        className="content-card group relative cursor-pointer"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`Play ${title}`}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse z-10 flex items-center justify-center rounded">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Image */}
        <div className="relative aspect-video overflow-hidden rounded">
          <img
            src={image}
            alt={title}
            className="content-card-image w-full h-full object-cover"
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
          />
          
          {/* Fallback for broken images */}
          {imageError && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center rounded">
              <div className="text-center text-gray-400">
                <div className="w-12 h-12 mx-auto mb-2 opacity-50">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <p className="text-xs">Image unavailable</p>
              </div>
            </div>
          )}
          
          {/* Hover Overlay with Netflix-style controls */}
          <div className="content-card-overlay">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                  </svg>
                </button>
                <button className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </button>
              </div>
              <button className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="mt-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
                <span className="text-green-400 font-semibold">98% Match</span>
                <span className="border border-white/40 px-1 py-0.5 text-xs">TV-MA</span>
                <span>{year}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{duration}</span>
                <span>•</span>
                <span>{genre}</span>
                <span>•</span>
                <span className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  {rating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <VideoPlayer
        title={title}
        videoUrl={videoUrl}
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        videoId={id}
      />
    </>
  );
};

export default ContentCard;