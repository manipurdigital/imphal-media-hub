import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  encodeVideoUrl, 
  analyzeVideoUrl, 
  generateFallbackUrls, 
  hasCORSIssues,
  getVideoMimeType 
} from '@/utils/videoUrl';

export interface VideoPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  buffered: number;
  error: string | null;
  canPlay: boolean;
  hasError: boolean;
}

export interface VideoPlaybackControls {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  retry: () => void;
  switchUrl: (url: string) => void;
}

export const useVideoPlayback = (
  videoRef: React.RefObject<HTMLVideoElement>,
  initialUrl: string | null,
  videoId?: string
) => {
  const [state, setState] = useState<VideoPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: false,
    buffered: 0,
    error: null,
    canPlay: false,
    hasError: false
  });

  const [currentUrl, setCurrentUrl] = useState<string | null>(initialUrl);
  const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Update accessibility status in database
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

  // Process URL with encoding and fallback generation
  const processVideoUrl = useCallback((url: string | null) => {
    if (!url) return null;

    const urlInfo = analyzeVideoUrl(url);
    const processedUrl = urlInfo.needsEncoding ? encodeVideoUrl(url) : url;
    const fallbacks = generateFallbackUrls(processedUrl);
    
    setCurrentUrl(processedUrl);
    setFallbackUrls(fallbacks);
    setCurrentFallbackIndex(0);
    
    return processedUrl;
  }, []);

  // Try next fallback URL
  const tryNextFallback = useCallback(() => {
    if (currentFallbackIndex < fallbackUrls.length - 1) {
      const nextIndex = currentFallbackIndex + 1;
      const nextUrl = fallbackUrls[nextIndex];
      
      console.log(`Trying fallback URL ${nextIndex + 1}/${fallbackUrls.length}:`, nextUrl);
      
      setCurrentUrl(nextUrl);
      setCurrentFallbackIndex(nextIndex);
      
      // Reset error state for retry
      setState(prev => ({ ...prev, error: null, hasError: false, isLoading: true }));
      
      return true;
    }
    return false;
  }, [currentFallbackIndex, fallbackUrls]);

  // Video event handlers
  const setupVideoEventHandlers = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: video.currentTime }));
      
      // Update buffered
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercentage = (bufferedEnd / video.duration) * 100;
        setState(prev => ({ ...prev, buffered: bufferedPercentage }));
      }
    };

    const handleDurationChange = () => {
      setState(prev => ({ ...prev, duration: video.duration }));
    };

    const handleLoadStart = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      if (videoId) {
        await updateVideoAccessibilityStatus(videoId, 'testing');
      }
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: video.duration, 
        canPlay: true, 
        isLoading: false,
        error: null,
        hasError: false 
      }));
      console.log('Video metadata loaded - duration:', video.duration);
    };

    const handleCanPlay = async () => {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        canPlay: true, 
        error: null,
        hasError: false 
      }));
      
      if (videoId) {
        await updateVideoAccessibilityStatus(videoId, 'accessible');
      }
      console.log('Video can play - duration:', video.duration);
    };

    const handleError = async (e: Event) => {
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
            accessibilityStatus = 'not_found';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Video format is not supported by your browser.';
            accessibilityStatus = 'not_found';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            if (currentUrl && hasCORSIssues(currentUrl)) {
              errorMessage = 'Video cannot be played due to CORS restrictions.';
              accessibilityStatus = 'cors_blocked';
            } else {
              errorMessage = 'Video source is not accessible.';
              accessibilityStatus = 'not_found';
            }
            break;
          default:
            errorMessage = `Video error: ${target.error.message}`;
        }
      }
      
      console.error('Video error:', errorMessage, 'URL:', currentUrl);
      
      // Try fallback URL before giving up
      if (!tryNextFallback()) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          canPlay: false, 
          error: errorMessage,
          hasError: true 
        }));
        
        if (videoId) {
          await updateVideoAccessibilityStatus(videoId, accessibilityStatus);
        }
      }
    };

    const handleLoadedData = () => {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        canPlay: true,
        error: null,
        hasError: false 
      }));
      console.log('Video data loaded');
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: video.volume, 
        isMuted: video.muted 
      }));
    };

    const handleWaiting = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handlePlaying = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    // Add event listeners
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
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

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
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [videoId, currentUrl, updateVideoAccessibilityStatus, tryNextFallback]);

  // Playback controls
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !state.canPlay) return;

    try {
      // Cancel any existing play promise
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }

      setState(prev => ({ ...prev, isLoading: true }));
      playPromiseRef.current = video.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
    } catch (error) {
      console.error('Play error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.canPlay]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || !isFinite(time)) return;

    try {
      video.currentTime = Math.max(0, Math.min(time, video.duration));
    } catch (error) {
      console.warn('Seek error:', error);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    video.volume = clampedVolume;
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setState(prev => ({ ...prev, isMuted: video.muted }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
  }, []);

  const retry = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;

    setState(prev => ({ 
      ...prev, 
      error: null, 
      hasError: false, 
      isLoading: true 
    }));

    // Reset to first fallback URL
    setCurrentFallbackIndex(0);
    setCurrentUrl(fallbackUrls[0] || currentUrl);

    // Force reload
    video.load();
  }, [currentUrl, fallbackUrls]);

  const switchUrl = useCallback((url: string) => {
    const processedUrl = processVideoUrl(url);
    if (processedUrl && videoRef.current) {
      videoRef.current.src = processedUrl;
      videoRef.current.load();
    }
  }, [processVideoUrl]);

  // Initialize URL processing
  useEffect(() => {
    if (initialUrl) {
      processVideoUrl(initialUrl);
    }
  }, [initialUrl, processVideoUrl]);

  // Setup event handlers
  useEffect(() => {
    const cleanup = setupVideoEventHandlers();
    return cleanup;
  }, [setupVideoEventHandlers]);

  // Update video source when URL changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && currentUrl) {
      const mimeType = getVideoMimeType(currentUrl);
      video.src = currentUrl;
      video.load();
      
      console.log('Video source updated:', currentUrl, 'MIME type:', mimeType);
    }
  }, [currentUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {});
        playPromiseRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const controls: VideoPlaybackControls = {
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    retry,
    switchUrl
  };

  return {
    state,
    controls,
    currentUrl,
    fallbackUrls,
    hasMoreFallbacks: currentFallbackIndex < fallbackUrls.length - 1
  };
};