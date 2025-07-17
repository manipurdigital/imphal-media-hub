import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/city/index.css';
import { X, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';
import { isVimeoUrl, extractVimeoVideoId, getVimeoEmbedUrl } from '@/utils/vimeo';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  videoId?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ title, videoUrl, isOpen, onClose, videoId }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check for YouTube/Vimeo URLs
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;
  const youTubeVideoId = isYouTube ? extractYouTubeVideoId(videoUrl!) : null;
  const youTubeEmbedUrl = youTubeVideoId ? getYouTubeEmbedUrl(youTubeVideoId) : null;

  const isVimeo = videoUrl ? isVimeoUrl(videoUrl) : false;
  const vimeoVideoId = isVimeo ? extractVimeoVideoId(videoUrl!) : null;
  const vimeoEmbedUrl = vimeoVideoId ? getVimeoEmbedUrl(vimeoVideoId) : null;

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    onClose();
  }, [onClose]);

  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !videoUrl || isYouTube || isVimeo) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-theme-city vjs-big-play-centered';
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      
      // Clear and append video element
      videoRef.current.innerHTML = '';
      videoRef.current.appendChild(videoElement);

      // Initialize Video.js player
      playerRef.current = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: false,
        fill: true,
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        preload: 'metadata',
        language: 'en',
        controlBar: {
          volumePanel: {
            inline: false
          },
          muteToggle: true,
          volumeControl: true,
          fullscreenToggle: true,
          playbackRateMenuButton: true,
          pictureInPictureToggle: true
        },
        sources: [{
          src: videoUrl,
          type: 'video/mp4'
        }],
        html5: {
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true
          }
        }
      });

      // Event handlers
      playerRef.current.ready(() => {
        setIsLoading(false);
        console.log('Video.js player ready');
      });

      playerRef.current.on('error', () => {
        const error = playerRef.current.error();
        let errorMessage = 'Failed to load video.';
        
        if (error) {
          switch (error.code) {
            case 1:
              errorMessage = 'Video playback was aborted.';
              break;
            case 2:
              errorMessage = 'Network error occurred while loading video.';
              break;
            case 3:
              errorMessage = 'Video format is not supported.';
              break;
            case 4:
              errorMessage = 'Video source is not accessible or CORS blocked.';
              break;
            default:
              errorMessage = error.message || 'Unknown video error.';
          }
        }

        setError(errorMessage);
        setIsLoading(false);
        console.error('Video.js error:', error);
      });

      playerRef.current.on('loadstart', () => {
        setIsLoading(true);
        setError(null);
      });

      playerRef.current.on('canplay', () => {
        setIsLoading(false);
      });

      playerRef.current.on('fullscreenchange', () => {
        setIsFullscreen(playerRef.current.isFullscreen());
      });

    } catch (err) {
      console.error('Failed to initialize Video.js player:', err);
      setError('Failed to initialize video player.');
      setIsLoading(false);
    }
  }, [videoUrl, isYouTube, isVimeo]);

  const retryVideo = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    setError(null);
    setTimeout(initializePlayer, 100);
  }, [initializePlayer]);

  // Initialize player when component mounts or URL changes
  useEffect(() => {
    if (isOpen && videoUrl && !isYouTube && !isVimeo) {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [isOpen, videoUrl, initializePlayer, isYouTube, isVimeo]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (isFullscreen && playerRef.current) {
          playerRef.current.exitFullscreen();
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, handleClose]);

  // Prevent body scroll when player is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div 
        className="fixed inset-0 bg-black z-50"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-player-title"
      >
        {/* Netflix-style Player Container */}
        <div className="relative w-full h-full">
          
          {/* Close Button - Netflix Style */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-[70] w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
            aria-label="Close player"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Video Container - Netflix Aspect Ratio */}
          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Main Video Area */}
            <div 
              className="relative w-full max-w-[90vw] max-h-[80vh] aspect-video bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-40">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-red-600 rounded-full animate-spin"></div>
                    <p className="text-white text-lg font-medium">Loading...</p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-40">
                  <div className="text-center text-white max-w-lg mx-4">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Something went wrong</h3>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">{error}</p>
                    
                    {error.includes('CORS') && (
                      <div className="bg-yellow-600/20 border border-yellow-600/40 rounded-lg p-4 mb-6 text-sm">
                        <p className="text-yellow-200">
                          This video cannot be played due to server restrictions. Please try a different video source.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex space-x-4 justify-center">
                      <button
                        onClick={retryVideo}
                        className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <RotateCcw className="w-5 h-5" />
                        <span>Try Again</span>
                      </button>
                      
                      <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Content */}
              {videoUrl ? (
                isYouTube ? (
                  <iframe
                    src={youTubeEmbedUrl}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`YouTube video: ${title}`}
                  />
                ) : isVimeo ? (
                  <iframe
                    src={vimeoEmbedUrl}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Vimeo video: ${title}`}
                  />
                ) : (
                  <div 
                    ref={videoRef} 
                    className="w-full h-full rounded-lg overflow-hidden"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
                  <div className="text-center text-white">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{title}</h2>
                    <p className="text-xl text-gray-400">No video source available</p>
                  </div>
                </div>
              )}

              {/* Netflix-style Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 z-50">
                <div className="max-w-2xl">
                  <h1 id="video-player-title" className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    {title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">HD</span>
                    <span className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Streaming now</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default VideoPlayer;