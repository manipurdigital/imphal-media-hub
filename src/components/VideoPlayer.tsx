import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  X, 
  Settings,
  SkipBack,
  SkipForward,
  Loader2,
  Maximize2,
  Volume1,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDebounceCallback } from '@/hooks/useDebounce';
import { useVideoResolutions } from '@/hooks/useVideoResolutions';
import { ResolutionSelector } from '@/components/ResolutionSelector';
import { supabase } from '@/integrations/supabase/client';

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  videoId?: string;
}

const VideoPlayer = memo(({ title, videoUrl, isOpen, onClose, videoId }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [isResolutionSwitching, setIsResolutionSwitching] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const playPromiseRef = useRef<Promise<void> | null>(null);
  
  // Resolution management - only use if videoId is a valid UUID
  const isValidVideoId = videoId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  const {
    resolutions,
    currentResolution,
    isLoading: resolutionsLoading,
    error: resolutionsError,
    switchResolution,
    hasMultipleResolutions,
  } = useVideoResolutions(isValidVideoId ? videoId : null);
  
  // Determine effective video URL (current resolution or fallback to videoUrl)
  const effectiveVideoUrl = (hasMultipleResolutions && currentResolution) ? currentResolution.source_url : videoUrl;
  
  const isYouTube = effectiveVideoUrl ? isYouTubeUrl(effectiveVideoUrl) : false;
  const youTubeVideoId = isYouTube ? extractYouTubeVideoId(effectiveVideoUrl!) : null;
  const youTubeEmbedUrl = youTubeVideoId ? getYouTubeEmbedUrl(youTubeVideoId) : null;

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Handle mouse movement
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMounted(false);
    
    // Cancel any pending play promise
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {
        // Ignore AbortError when closing
      });
      playPromiseRef.current = null;
    }
    
    // Reset video state
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(false);
    
    onClose();
  }, [onClose]);

  // Format time display
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update video accessibility status in database
  const updateVideoAccessibilityStatus = useCallback(async (videoId: string, status: string) => {
    try {
      await supabase
        .from('videos')
        .update({ 
          accessibility_status: status,
          accessibility_checked_at: new Date().toISOString()
        })
        .eq('id', videoId);
    } catch (error) {
      console.error('Failed to update video accessibility status:', error);
    }
  }, []);

  // Check if URL is likely to have CORS issues
  const hasLikelyCORSIssues = useCallback((url: string): boolean => {
    if (!url) return false;
    
    // YouTube videos don't have CORS issues as they use iframe embedding
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return false;
    }
    
    // Supabase hosted videos should work
    if (url.includes('zzulxowwlqndtrlmfnij.supabase.co')) {
      return false;
    }
    
    // Check for known problematic domains
    const problematicDomains = [
      'commondatastorage.googleapis.com',
      'storage.googleapis.com',
      'drive.google.com',
      's3.amazonaws.com',
      '.s3.',
      'cloudfront.net',
      'dropbox.com',
      'onedrive.com'
    ];
    
    return problematicDomains.some(domain => url.includes(domain));
  }, []);

  // Video event handlers
  const handleVideoEvents = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Update buffered
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleLoadStart = async () => {
      setIsLoading(true);
      if (isValidVideoId && videoId) {
        await updateVideoAccessibilityStatus(videoId, 'testing');
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setCanPlay(true);
      setIsLoading(false);
      setError(null);
      console.log('Video metadata loaded - duration:', video.duration);
    };

    const handleCanPlay = async () => {
      setIsLoading(false);
      setCanPlay(true);
      setError(null);
      if (isValidVideoId && videoId) {
        await updateVideoAccessibilityStatus(videoId, 'accessible');
      }
      console.log('Video can play - duration:', video.duration);
    };

    const handleError = async (e: Event) => {
      setIsLoading(false);
      setCanPlay(false);
      const target = e.target as HTMLVideoElement;
      let errorMessage = 'Failed to load video.';
      let accessibilityStatus = 'not_found';
      
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Video playback was aborted.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred while loading video.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Video format is not supported by your browser.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video source is not accessible. This may be due to CORS restrictions or the video being unavailable.';
            break;
          default:
            errorMessage = `Video error: ${target.error.message} (Code: ${target.error.code})`;
        }
      }
      
      // Check if this might be a CORS issue using our detection function
      if (effectiveVideoUrl && !effectiveVideoUrl.includes('youtube.com') && !effectiveVideoUrl.includes('youtu.be')) {
        if (target.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || hasLikelyCORSIssues(effectiveVideoUrl)) {
          accessibilityStatus = 'cors_blocked';
          errorMessage = `This video cannot be played due to CORS restrictions. 
            
Technical Info: This video is hosted on an external server that doesn't allow direct playback. The video needs to be configured with proper CORS headers or moved to a compatible hosting service.

Suggested Solutions:
• Upload the video to Supabase storage for reliable playback
• Contact the video host to enable CORS for your domain
• Use a different video hosting service

Video Status: Marked as CORS-blocked for admin review`;
        }
      }
      
      // Update accessibility status in database
      if (isValidVideoId && videoId) {
        await updateVideoAccessibilityStatus(videoId, accessibilityStatus);
      }
      
      setError(errorMessage);
      console.error('Video error:', errorMessage, 'URL:', effectiveVideoUrl);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      setCanPlay(true);
      console.log('Video data loaded');
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [hasLikelyCORSIssues, updateVideoAccessibilityStatus, isValidVideoId, videoId]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || !videoRef.current) return;

    const video = videoRef.current;
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (video && isMounted && isFinite(video.duration) && video.duration > 0) {
          const newTime = Math.max(0, video.currentTime - 10);
          if (isFinite(newTime)) {
            try {
              video.currentTime = newTime;
            } catch (error) {
              console.warn('Error seeking video:', error);
            }
          }
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (video && isMounted && isFinite(video.duration) && video.duration > 0) {
          const newTime = Math.min(video.duration, video.currentTime + 10);
          if (isFinite(newTime)) {
            try {
              video.currentTime = newTime;
            } catch (error) {
              console.warn('Error seeking video:', error);
            }
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(prev => Math.min(1, prev + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(prev => Math.max(0, prev - 0.1));
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        if (isFullscreen) {
          document.exitFullscreen();
        } else {
          onClose();
        }
        break;
    }
  }, [isOpen, isMounted, isFullscreen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = 'hidden';
      resetControlsTimeout();
    } else {
      setIsMounted(false);
      document.body.style.overflow = 'unset';
      
      // Cancel any pending play promise when closing
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore AbortError when closing
        });
        playPromiseRef.current = null;
      }
      
      // Reset states
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(false);
      setBuffered(0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = 'unset';
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      // Cancel any pending play promise on cleanup
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {
          // Ignore AbortError on cleanup
        });
        playPromiseRef.current = null;
      }
    };
  }, [isOpen, handleKeyDown, handleMouseMove, resetControlsTimeout]);

  useEffect(() => {
    const cleanup = handleVideoEvents();
    return cleanup;
  }, [handleVideoEvents]);

  // Update video volume when volume state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Update video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);


  // Test video URL accessibility
  const testVideoUrl = useCallback(async (url: string): Promise<{ accessible: boolean; error?: string }> => {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      return { accessible: response.ok };
    } catch (error: any) {
      console.warn('Video URL test failed:', error);
      
      // Provide more specific error information
      if (error.name === 'TypeError' && error.message.includes('CORS')) {
        return { accessible: false, error: 'CORS_ERROR' };
      }
      
      return { accessible: false, error: 'NETWORK_ERROR' };
    }
  }, []);

  // Initialize video when modal opens (only when video source changes)
  useEffect(() => {
    if (isOpen && videoRef.current && effectiveVideoUrl && !isYouTube) {
      const video = videoRef.current;
      
      console.log('Initializing video with URL:', effectiveVideoUrl);
      
      // Reset states
      setError(null);
      setCanPlay(false);
      setDuration(0);
      setCurrentTime(0);
      setIsLoading(true);
      
      // Test video accessibility first for external URLs
      const initializeVideo = async () => {
        // Skip testing for local or trusted sources
        const isLocalOrTrusted = effectiveVideoUrl.startsWith('blob:') || 
                                effectiveVideoUrl.startsWith('data:') ||
                                effectiveVideoUrl.includes('supabase.co');
        
        if (!isLocalOrTrusted) {
          console.log('Testing video URL accessibility...');
          
          // First check if the URL is likely to have CORS issues
          if (hasLikelyCORSIssues(effectiveVideoUrl)) {
            setError(`Video cannot be played due to CORS restrictions. The video is hosted on ${new URL(effectiveVideoUrl).hostname} which doesn't allow direct video playback from external websites. Please contact the administrator to move the video to a compatible hosting service.`);
            setIsLoading(false);
            return;
          }
          
          const { accessible, error: testError } = await testVideoUrl(effectiveVideoUrl);
          
          if (!accessible) {
            let errorMessage = 'Video source is not accessible.';
            
            if (testError === 'CORS_ERROR') {
              errorMessage = 'Video cannot be played due to CORS restrictions. The video hosting service needs to be configured to allow cross-origin requests.';
            } else if (testError === 'NETWORK_ERROR') {
              errorMessage = 'Network error occurred while trying to access the video. Please check your internet connection and try again.';
            }
            
            setError(errorMessage);
            setIsLoading(false);
            return;
          }
        }
        
        // Set initial properties immediately
        video.volume = volume;
        video.muted = isMuted;
        video.playbackRate = playbackSpeed;
        
        // Force load video metadata
        video.load();
        
        console.log('Video initialized with properties - volume:', volume, 'muted:', isMuted, 'playbackRate:', playbackSpeed);
      };
      
      initializeVideo();
    }
  }, [isOpen, effectiveVideoUrl, isYouTube, testVideoUrl]);

  // Update video mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (videoRef.current && isMounted) {
      try {
        if (videoRef.current.paused) {
          setIsLoading(true);
          playPromiseRef.current = videoRef.current.play();
          playPromiseRef.current
            .then(() => {
              if (isMounted) {
                setIsLoading(false);
                setIsPlaying(true);
              }
            })
            .catch(error => {
              if (isMounted && error.name !== 'AbortError') {
                console.warn('Error playing video:', error);
                setIsLoading(false);
                setIsPlaying(false);
              }
            });
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
          playPromiseRef.current = null;
        }
      } catch (error) {
        if (isMounted) {
          console.warn('Error toggling play state:', error);
          setIsLoading(false);
        }
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !isMounted) {
      console.log('Seek blocked - video:', !!video, 'mounted:', isMounted);
      return;
    }
    
    // Use video element's duration if available, otherwise use state duration
    const videoDuration = video.duration || duration;
    
    if (!videoDuration || videoDuration <= 0 || !isFinite(videoDuration)) {
      console.log('Seek blocked - no valid duration. Video duration:', video.duration, 'state duration:', duration);
      return;
    }
    
    const newTime = (value[0] / 100) * videoDuration;
    console.log('Seeking to:', newTime, 'seconds (', value[0], '% of', videoDuration, 'seconds)');
    
    if (isFinite(newTime) && newTime >= 0 && newTime <= videoDuration) {
      try {
        video.currentTime = newTime;
        console.log('Successfully set video time to:', video.currentTime);
      } catch (error) {
        console.error('Error seeking video:', error);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    console.log('Volume change:', value);
    setVolume(value[0] / 100);
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100;
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current && isMounted && duration && isFinite(duration)) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      if (isFinite(newTime)) {
        try {
          videoRef.current.currentTime = newTime;
        } catch (error) {
          console.warn('Error skipping video:', error);
        }
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleResolutionChange = useCallback((resolution: typeof currentResolution) => {
    if (!resolution || !videoRef.current) return;
    
    // Store current playback position and state
    const currentPosition = videoRef.current.currentTime;
    const wasPlaying = isPlaying;
    
    setIsResolutionSwitching(true);
    setIsLoading(true);
    
    // Switch to new resolution
    switchResolution(resolution);
    
    // The video will reinitialize with the new URL through the useEffect
    // We'll restore the position once the new video is loaded
    const restorePosition = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentPosition;
        if (wasPlaying) {
          videoRef.current.play();
        }
        setIsResolutionSwitching(false);
      }
    };
    
    // Listen for loadedmetadata to restore position
    const handleLoadedMetadata = () => {
      restorePosition();
      videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
    
    videoRef.current?.addEventListener('loadedmetadata', handleLoadedMetadata);
  }, [isPlaying, switchResolution]);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-player-title"
        aria-describedby="video-player-description"
      >
        {/* Video Container */}
        <div 
          className="relative w-full h-full"
          onClick={(e) => e.stopPropagation()}
          onMouseMove={handleMouseMove}
        >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-[60] text-white hover:bg-white/20 pointer-events-auto"
          onClick={handleClose}
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Loading Indicator */}
        {(isLoading || isResolutionSwitching) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            {isResolutionSwitching && (
              <div className="absolute top-20 text-white text-sm">
                Switching to {currentResolution?.resolution}...
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
            <div className="text-center text-white max-w-lg mx-4">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Playback Error</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              
              {/* Additional help for CORS issues */}
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
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  Retry
                </Button>
                {/* Show fallback option for videos with resolutions */}
                {hasMultipleResolutions && resolutions.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      const nextResolution = resolutions.find(r => r.id !== currentResolution?.id);
                      if (nextResolution) {
                        switchResolution(nextResolution);
                      }
                    }}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    Try Different Quality
                  </Button>
                )}
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

        {/* Video Element */}
        {effectiveVideoUrl ? (
          isYouTube ? (
            <iframe
              src={youTubeEmbedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
              onDoubleClick={toggleFullscreen}
              preload="metadata"
              crossOrigin="anonymous"
              playsInline
            >
              <source src={effectiveVideoUrl} type="video/mp4" />
              {/* Add additional source formats for better compatibility */}
              {effectiveVideoUrl.includes('.mp4') && (
                <source src={effectiveVideoUrl.replace('.mp4', '.webm')} type="video/webm" />
              )}
              {effectiveVideoUrl.includes('.mp4') && (
                <source src={effectiveVideoUrl.replace('.mp4', '.ogg')} type="video/ogg" />
              )}
              Your browser does not support the video tag.
            </video>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <h2 id="video-player-title" className="text-3xl font-bold mb-4">{title}</h2>
              <p id="video-player-description" className="text-gray-400 mb-8">Video content will be available soon</p>
              <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Video Controls */}
        {effectiveVideoUrl && !isYouTube && (
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseEnter={() => setShowControls(true)}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative">
                {/* Buffered Progress */}
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-white/30 rounded-full"
                  style={{ width: `${buffered}%`, transform: 'translateY(-50%)' }}
                />
                 {/* Seek Slider */}
                 <Slider
                   value={[duration && isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0]}
                   onValueChange={handleSeek}
                   max={100}
                   step={0.1}
                   className="w-full cursor-pointer"
                 />
              </div>
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{formatTime(isFinite(currentTime) ? currentTime : 0)}</span>
                <span>{formatTime(isFinite(duration) ? duration : 0)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </Button>

                {/* Skip Back */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => skip(-10)}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {React.createElement(getVolumeIcon(), { className: "w-5 h-5" })}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="text-white text-sm ml-4">
                  <h3 className="font-semibold truncate max-w-xs">{title}</h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Resolution Selector - only show if valid videoId and multiple resolutions */}
                {isValidVideoId && hasMultipleResolutions && (
                  <ResolutionSelector
                    resolutions={resolutions}
                    currentResolution={currentResolution}
                    onResolutionChange={handleResolutionChange}
                    isLoading={isResolutionSwitching}
                    disabled={isYouTube}
                  />
                )}
                
                {/* Playback Speed */}
                <Select value={playbackSpeed.toString()} onValueChange={(value) => {
                  console.log('Playback speed selector clicked, value:', value);
                  const speed = Number(value);
                  console.log('Setting playback speed to:', speed);
                  setPlaybackSpeed(speed);
                  
                  // Ensure video element exists and set playback rate immediately
                  if (videoRef.current) {
                    videoRef.current.playbackRate = speed;
                    console.log('Video playback rate set to:', videoRef.current.playbackRate);
                  } else {
                    console.warn('Video ref not available when setting playback rate');
                  }
                }}>
                  <SelectTrigger className="w-16 h-8 text-white border-white/30 bg-black/90 hover:bg-black/70 focus:ring-2 focus:ring-white/50 z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/30 text-white z-[60]">
                    <SelectItem value="0.5" className="text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer">0.5x</SelectItem>
                    <SelectItem value="0.75" className="text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer">0.75x</SelectItem>
                    <SelectItem value="1" className="text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer">1x</SelectItem>
                    <SelectItem value="1.25" className="text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer">1.25x</SelectItem>
                    <SelectItem value="1.5" className="text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer">1.5x</SelectItem>
                    <SelectItem value="2" className="text-white hover:bg-white/20 focus:bg-white/20 cursor-pointer">2x</SelectItem>
                  </SelectContent>
                </Select>

                {/* Picture-in-Picture */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    if (videoRef.current && 'requestPictureInPicture' in videoRef.current) {
                      videoRef.current.requestPictureInPicture();
                    }
                  }}
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* YouTube Video Title Overlay */}
        {effectiveVideoUrl && isYouTube && (
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseEnter={() => setShowControls(true)}
          >
            <h3 className="text-white font-semibold">{title}</h3>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="absolute top-4 left-4 text-white/70 text-xs">
          <p>Space: Play/Pause | ← →: Seek | ↑ ↓: Volume | F: Fullscreen | M: Mute</p>
        </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default VideoPlayer;