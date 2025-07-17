import React, { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { X, Loader2, AlertCircle, RotateCcw, Settings, Check } from 'lucide-react';
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';
import { isVimeoUrl, extractVimeoVideoId, getVimeoEmbedUrl } from '@/utils/vimeo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useVideoResolutions } from '@/hooks/useVideoResolutions';

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  videoId?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ title, videoUrl, isOpen, onClose, videoId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);

  // Video resolutions hook
  const { 
    resolutions, 
    currentResolution, 
    isLoading: resolutionsLoading, 
    switchResolution, 
    hasMultipleResolutions 
  } = useVideoResolutions(videoId || null);

  // Use current resolution URL or fallback to original videoUrl
  const activeVideoUrl = currentResolution?.processed_url || currentResolution?.source_url || videoUrl;

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
      try {
        playerRef.current.dispose();
      } catch (err) {
        console.warn('Error disposing video player:', err);
      }
      playerRef.current = null;
    }
    onClose();
  }, [onClose]);

  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !activeVideoUrl || isYouTube || isVimeo) return;

    setIsLoading(true);
    setError(null);

    try {
      // Dispose existing player if any
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      // Configure video.js with YouTube-like settings
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        responsive: true,
        preload: 'metadata',
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        language: 'en',
        html5: {
          vhs: {
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: false
          }
        },
        controlBar: {
          progressControl: {
            seekBar: {
              mouseTimeDisplay: true
            }
          },
          volumePanel: {
            inline: false,
            vertical: true
          },
          muteToggle: true,
          volumeControl: true,
          currentTimeDisplay: true,
          durationDisplay: true,
          timeDivider: true,
          playbackRateMenuButton: {
            playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
          },
          fullscreenToggle: true,
          pictureInPictureToggle: true
        },
        sources: [{
          src: activeVideoUrl,
          type: activeVideoUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
        }]
      });

      // Event handlers
      playerRef.current.ready(() => {
        setIsLoading(false);
        console.log('Video.js player ready with resolution:', currentResolution?.quality_label || 'default');
        
        // Enable seeking
        playerRef.current.on('loadedmetadata', () => {
          console.log('Video metadata loaded, seeking enabled');
        });
      });

      playerRef.current.on('error', () => {
        const error = playerRef.current.error();
        let errorMessage = 'Video could not be played.';
        
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
              errorMessage = 'Video source could not be loaded.';
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
  }, [activeVideoUrl, isYouTube, isVimeo, currentResolution]);

  const handleResolutionChange = useCallback(async (resolution: typeof currentResolution) => {
    if (!resolution || !playerRef.current) return;
    
    // Store current time position
    const currentTime = playerRef.current.currentTime();
    const wasPaused = playerRef.current.paused();
    
    // Switch resolution
    switchResolution(resolution);
    setShowQualitySelector(false);
    
    // Wait for the new source to be ready and restore playback position
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.currentTime(currentTime);
        if (!wasPaused) {
          playerRef.current.play();
        }
      }
    }, 100);
  }, [switchResolution]);

  const retryVideo = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.dispose();
      } catch (err) {
        console.warn('Error disposing video player during retry:', err);
      }
      playerRef.current = null;
    }
    setError(null);
    setTimeout(initializePlayer, 100);
  }, [initializePlayer]);

  // Initialize player when component mounts or URL changes
  useEffect(() => {
    if (isOpen && activeVideoUrl && !isYouTube && !isVimeo) {
      const timer = setTimeout(initializePlayer, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (err) {
          console.warn('Error disposing video player in cleanup:', err);
        }
        playerRef.current = null;
      }
    };
  }, [isOpen, activeVideoUrl, initializePlayer, isYouTube, isVimeo]);

  // Handle keyboard shortcuts and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (showQualitySelector) {
          setShowQualitySelector(false);
        } else if (isFullscreen && playerRef.current) {
          playerRef.current.exitFullscreen();
        } else {
          handleClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (showQualitySelector && e.target instanceof Element && !e.target.closest('.quality-selector')) {
        setShowQualitySelector(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, isFullscreen, handleClose, showQualitySelector]);

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
        {/* YouTube-style Player Container */}
        <div className="relative w-full h-full flex flex-col">
          
          {/* Header with title and close button */}
          <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <h1 id="video-player-title" className="text-white text-lg font-medium truncate mr-4">
              {title}
            </h1>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close player"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Video Area */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-7xl max-h-full">
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 rounded-lg">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                    <p className="text-white text-sm">Loading video...</p>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-40 rounded-lg">
                  <div className="text-center text-white max-w-md mx-4">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-3">Video unavailable</h3>
                    <p className="text-gray-300 mb-6 text-sm leading-relaxed">{error}</p>
                    
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={retryVideo}
                        className="px-4 py-2 bg-white text-black text-sm font-medium rounded hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retry</span>
                      </button>
                      
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
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
                    src={`${youTubeEmbedUrl}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={`YouTube video: ${title}`}
                  />
                ) : isVimeo ? (
                  <iframe
                    src={`${vimeoEmbedUrl}?autoplay=1&controls=1`}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Vimeo video: ${title}`}
                  />
                ) : (
                  <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      className="video-js vjs-default-skin w-full h-full"
                      controls
                      preload="metadata"
                      width="100%"
                      height="100%"
                      data-setup="{}"
                    >
                      <p className="vjs-no-js text-white text-center p-8">
                        To view this video please enable JavaScript, and consider upgrading to a web browser that
                        <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer" className="text-blue-400">
                          supports HTML5 video
                        </a>.
                      </p>
                    </video>
                    
                    {/* Quality Selector Button */}
                    {hasMultipleResolutions && (
                      <div className="absolute top-4 right-4 z-50 quality-selector">
                        <div className="relative">
                          <button
                            onClick={() => setShowQualitySelector(!showQualitySelector)}
                            className="bg-black/70 hover:bg-black/90 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors backdrop-blur-sm"
                            aria-label="Quality settings"
                          >
                            <Settings className="w-4 h-4" />
                            <span>{currentResolution?.quality_label || 'Auto'}</span>
                          </button>
                          
                          {/* Quality Dropdown */}
                          {showQualitySelector && (
                            <div className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 min-w-[120px] z-60">
                              <div className="py-2">
                                <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                                  Quality
                                </div>
                                {resolutions.map((resolution) => (
                                  <button
                                    key={resolution.id}
                                    onClick={() => handleResolutionChange(resolution)}
                                    className="w-full px-3 py-2 text-left text-white hover:bg-white/10 flex items-center justify-between text-sm transition-colors"
                                  >
                                    <span>{resolution.quality_label}</span>
                                    {currentResolution?.id === resolution.id && (
                                      <Check className="w-4 h-4 text-red-500" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
                  <div className="text-center text-white">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">{title}</h2>
                    <p className="text-gray-400">No video source available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default VideoPlayer;