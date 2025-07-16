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
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';
import { isVimeoUrl, extractVimeoVideoId, getVimeoEmbedUrl } from '@/utils/vimeo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useVideoResolutions } from '@/hooks/useVideoResolutions';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { ResolutionSelector } from '@/components/ResolutionSelector';
import { analyzeVideoUrl } from '@/utils/videoUrl';

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  videoId?: string;
}

const VideoPlayer = memo(({ title, videoUrl, isOpen, onClose, videoId }: VideoPlayerProps) => {
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isResolutionSwitching, setIsResolutionSwitching] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
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
  
  // Get effective video URL
  const getEffectiveVideoUrl = () => {
    // If we have a current resolution, use processed URL
    if (currentResolution?.processed_url) {
      return currentResolution.processed_url;
    }
    
    // If we have a current resolution but no processed URL, use source URL
    if (currentResolution?.source_url) {
      return currentResolution.source_url;
    }
    
    // Fallback to original videoUrl if no resolution available
    return videoUrl || null;
  };
  
  const effectiveVideoUrl = getEffectiveVideoUrl();
  
  // Determine if this is a YouTube or Vimeo video
  const isYouTube = effectiveVideoUrl ? isYouTubeUrl(effectiveVideoUrl) : false;
  const youTubeVideoId = isYouTube ? extractYouTubeVideoId(effectiveVideoUrl!) : null;
  const youTubeEmbedUrl = youTubeVideoId ? getYouTubeEmbedUrl(youTubeVideoId) : null;
  
  const isVimeo = effectiveVideoUrl ? isVimeoUrl(effectiveVideoUrl) : false;
  const vimeoVideoId = isVimeo ? extractVimeoVideoId(effectiveVideoUrl!) : null;
  const vimeoEmbedUrl = vimeoVideoId ? getVimeoEmbedUrl(vimeoVideoId) : null;
  
  // Video playback management - only for HTML5 videos, not YouTube/Vimeo
  const {
    state: playbackState,
    controls: playbackControls,
    currentUrl,
    hasMoreFallbacks
  } = useVideoPlayback(videoRef, !isYouTube && !isVimeo ? effectiveVideoUrl : null, videoId);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowVideoControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playbackState.isPlaying) {
        setShowVideoControls(false);
      }
    }, 3000);
  }, [playbackState.isPlaying]);

  // Handle mouse movement
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMounted(false);
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || !videoRef.current) return;

    const video = videoRef.current;
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        playbackControls.togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        playbackControls.seek(Math.max(0, playbackState.currentTime - 10));
        break;
      case 'ArrowRight':
        e.preventDefault();
        playbackControls.seek(Math.min(playbackState.duration, playbackState.currentTime + 10));
        break;
      case 'ArrowUp':
        e.preventDefault();
        playbackControls.setVolume(Math.min(1, playbackState.volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        playbackControls.setVolume(Math.max(0, playbackState.volume - 0.1));
        break;
      case 'm':
        e.preventDefault();
        playbackControls.toggleMute();
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
  }, [isOpen, playbackState, playbackControls, isFullscreen, onClose]);

  // Mount/unmount effects
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
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = 'unset';
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, handleKeyDown, handleMouseMove, resetControlsTimeout]);

  // Update video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Control functions
  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * playbackState.duration;
    playbackControls.seek(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    playbackControls.setVolume(value[0] / 100);
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(playbackState.duration, playbackState.currentTime + seconds));
    playbackControls.seek(newTime);
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
    const currentPosition = playbackState.currentTime;
    const wasPlaying = playbackState.isPlaying;
    
    setIsResolutionSwitching(true);
    
    // Switch to new resolution
    switchResolution(resolution);
    
    // The video will reinitialize with the new URL through the useVideoPlayback hook
    // We'll restore the position once the new video is loaded
    setTimeout(() => {
      if (videoRef.current) {
        playbackControls.seek(currentPosition);
        if (wasPlaying) {
          playbackControls.play();
        }
        setIsResolutionSwitching(false);
      }
    }, 1000);
  }, [playbackState.currentTime, playbackState.isPlaying, switchResolution, playbackControls]);

  const getVolumeIcon = () => {
    if (playbackState.isMuted || playbackState.volume === 0) return VolumeX;
    if (playbackState.volume < 0.5) return Volume1;
    return Volume2;
  };

  // Debug logging
  // Enhanced video player with better UX
  const playerReady = isYouTube || isVimeo || (effectiveVideoUrl && (playbackState.canPlay || playbackState.isLoading));
  const shouldShowControls = !isYouTube && !isVimeo && effectiveVideoUrl;
  const hasVideoContent = effectiveVideoUrl && (isYouTube || isVimeo || currentUrl);

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
          {(playbackState.isLoading || isResolutionSwitching) && (
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
          {playbackState.hasError && playbackState.error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
              <div className="text-center text-white max-w-lg mx-4">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Playback Error</h3>
                <p className="text-gray-300 mb-4">{playbackState.error}</p>
                
                {/* Additional help for CORS issues */}
                {playbackState.error.includes('CORS') && (
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
                    onClick={playbackControls.retry}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  
                  {/* Show fallback option if available */}
                  {hasMoreFallbacks && (
                    <Button
                      variant="outline"
                      onClick={playbackControls.retry}
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      Try Fallback
                    </Button>
                  )}
                  
                  {/* Show different quality option for videos with resolutions */}
                  {hasMultipleResolutions && resolutions.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => {
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
              <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                onClick={playbackControls.togglePlay}
                onDoubleClick={toggleFullscreen}
                preload="metadata"
                playsInline
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
                crossOrigin="anonymous"
              >
                <source src={currentUrl || effectiveVideoUrl} type="video/mp4" />
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
          {effectiveVideoUrl && !isYouTube && !isVimeo && (
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 transition-opacity duration-300 ${
                showVideoControls ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseEnter={() => setShowVideoControls(true)}
            >
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="relative">
                  {/* Buffered Progress */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-white/30 rounded-full"
                    style={{ width: `${playbackState.buffered}%`, transform: 'translateY(-50%)' }}
                  />
                  {/* Seek Slider */}
                  <Slider
                    value={[playbackState.duration > 0 ? (playbackState.currentTime / playbackState.duration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    step={0.1}
                    className="w-full cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/70 mt-1">
                  <span>{formatTime(playbackState.currentTime)}</span>
                  <span>{formatTime(playbackState.duration)}</span>
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
                    onClick={playbackControls.togglePlay}
                  >
                    {playbackState.isPlaying ? (
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
                      onClick={playbackControls.toggleMute}
                    >
                      {React.createElement(getVolumeIcon(), { className: "w-5 h-5" })}
                    </Button>
                    <div className="w-20">
                      <Slider
                        value={[playbackState.volume * 100]}
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
                    const speed = Number(value);
                    setPlaybackSpeed(speed);
                    playbackControls.setPlaybackRate(speed);
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
                showVideoControls ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseEnter={() => setShowVideoControls(true)}
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