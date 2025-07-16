import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Volume1
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isYouTubeUrl, extractYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';

interface VideoPlayerProps {
  title: string;
  videoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayer = ({ title, videoUrl, isOpen, onClose }: VideoPlayerProps) => {
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
  const [isSeeking, setIsSeeking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout>();
  
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;
  const youTubeVideoId = isYouTube ? extractYouTubeVideoId(videoUrl!) : null;
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

  // Video event handlers
  const handleVideoEvents = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
      
      // Update buffered
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
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
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [isSeeking]);

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
      
      // Clear seek timeout
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
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

  const togglePlay = () => {
    if (videoRef.current && isMounted) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
          playPromiseRef.current = null;
        } else {
          setIsLoading(true);
          playPromiseRef.current = videoRef.current.play();
          playPromiseRef.current
            .then(() => {
              if (isMounted) {
                setIsLoading(false);
              }
            })
            .catch(error => {
              if (isMounted && error.name !== 'AbortError') {
                console.warn('Error playing video:', error);
                setIsLoading(false);
              }
            });
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
      videoRef.current.muted = !isMuted;
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current && isMounted && duration && isFinite(duration) && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      if (isFinite(newTime) && newTime >= 0 && newTime <= duration) {
        try {
          setIsSeeking(true);
          setCurrentTime(newTime); // Update UI immediately for smooth feedback
          
          // Clear any existing seek timeout
          if (seekTimeoutRef.current) {
            clearTimeout(seekTimeoutRef.current);
          }
          
          // Debounce the actual seek operation
          seekTimeoutRef.current = setTimeout(() => {
            if (videoRef.current && isMounted) {
              videoRef.current.currentTime = newTime;
              setIsSeeking(false);
            }
          }, 100);
        } catch (error) {
          console.warn('Error seeking video:', error);
          setIsSeeking(false);
        }
      }
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setShowControls(true);
  };

  const handleSeekEnd = () => {
    // Clear any pending seek timeout and apply final seek
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
    setIsSeeking(false);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (videoRef.current) {
      videoRef.current.muted = false;
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

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  if (!isOpen) return null;

  return (
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
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        {/* Video Element */}
        {videoUrl ? (
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
            >
              <source src={videoUrl} type="video/mp4" />
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
        {videoUrl && !isYouTube && (
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
                   onValueCommit={handleSeekEnd}
                   onPointerDown={handleSeekStart}
                   max={100}
                   step={0.1}
                   className="w-full cursor-pointer hover:cursor-grab active:cursor-grabbing"
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
                {/* Playback Speed */}
                <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(Number(value))}>
                  <SelectTrigger className="w-16 h-8 text-white border-white/30 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
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
        {videoUrl && isYouTube && (
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
  );
};

export default VideoPlayer;