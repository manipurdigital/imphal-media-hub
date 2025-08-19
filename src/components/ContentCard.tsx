import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkSubscription } = useSubscriptionStatus();
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [canWatch, setCanWatch] = useState(false);

  const handleClick = async () => {
    // Always check if user can watch this specific video
    if (!videoUrl) {
      // No video URL means this is a non-subscriber trying to watch
      if (!user) {
        navigate('/auth?tab=signup');
        return;
      }
      
      // User is signed in but can't watch - check subscription
      const hasActiveSubscription = await checkSubscription();
      if (!hasActiveSubscription) {
        navigate('/subscription');
        return;
      }
      
      // Show subscription required message
      alert('This video requires an active subscription to watch.');
      return;
    }
    
    // Video URL is available, user can watch
    setShowPlayer(true);
  };

  return (
    <>
      <div 
        className="content-card group relative"
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
          
          {/* Hover Overlay with play button - show lock if can't watch */}
          <div className="content-card-overlay">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className={`w-10 h-10 ${videoUrl ? 'bg-white' : 'bg-gray-500'} rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors`}>
                  {videoUrl ? (
                    <svg className="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8zM9 9h6v6H9V9zm1 7a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1z"/>
                    </svg>
                  )}
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
                {videoUrl ? (
                  <span className="text-green-400 font-semibold">98% Match</span>
                ) : (
                  <span className="text-red-400 font-semibold">🔒 Subscription Required</span>
                )}
                <span className="border border-white/40 px-1 py-0.5 text-xs">TV-MA</span>
                <span>{year}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <span>{duration}</span>
                <span>•</span>
                <span>{genre}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Info Section - Always Visible */}
        <div className="content-card-info">
          <h3 className="content-card-title">{title}</h3>
          <div className="content-card-rating">
            <span className="text-yellow-400">★</span>
            <span>{rating}</span>
          </div>
          <p className="content-card-description">
            {description || 'No description available'}
          </p>
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