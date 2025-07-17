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
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-player-title"
      >
        <div 
          className="relative w-full h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-[60] text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Title */}
          <div className="absolute top-4 left-4 z-[60] text-white">
            <h2 id="video-player-title" className="text-xl font-semibold">
              {title}
            </h2>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
              <div className="text-center text-white max-w-lg mx-4">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Playback Error</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                
                {error.includes('CORS') && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4 text-sm">
                    <p className="text-yellow-200">
                      <strong>Technical Info:</strong> This video is hosted on an external server that doesn't allow direct playback. 
                      The video needs to be configured with proper CORS headers or moved to a compatible hosting service.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={retryVideo}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video Content */}
          {videoUrl ? (
            isYouTube ? (
              <iframe
                src={youTubeEmbedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`YouTube video: ${title}`}
              />
            ) : isVimeo ? (
              <iframe
                src={vimeoEmbedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Vimeo video: ${title}`}
              />
            ) : (
              <div 
                ref={videoRef} 
                className="w-full h-full flex items-center justify-center"
                style={{ minHeight: '400px' }}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-4">{title}</h2>
                <p className="text-xl text-gray-400">No video source available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default VideoPlayer;