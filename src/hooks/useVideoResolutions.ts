import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { encodeVideoUrl, analyzeVideoUrl } from '@/utils/videoUrl';

export interface VideoResolution {
  id: string;
  resolution: string;
  quality_label: string;
  source_url: string;
  bitrate?: number;
  file_size?: number;
  is_default: boolean;
  processed_url?: string; // URL after encoding/processing
}

export const useVideoResolutions = (videoId: string | null) => {
  const [resolutions, setResolutions] = useState<VideoResolution[]>([]);
  const [currentResolution, setCurrentResolution] = useState<VideoResolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      setResolutions([]);
      setCurrentResolution(null);
      return;
    }

    const fetchResolutions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('video_sources')
          .select('*')
          .eq('video_id', videoId)
          .order('bitrate', { ascending: false });

        if (error) {
          throw error;
        }

        // Process URLs for better compatibility
        const processedResolutions = (data || []).map(resolution => {
          const urlInfo = analyzeVideoUrl(resolution.source_url);
          const processedUrl = urlInfo.needsEncoding ? encodeVideoUrl(resolution.source_url) : resolution.source_url;
          
          return {
            ...resolution,
            processed_url: processedUrl
          };
        });
        
        setResolutions(processedResolutions);
        
        // Set default resolution
        const defaultResolution = processedResolutions.find(r => r.is_default) || processedResolutions[0];
        if (defaultResolution) {
          setCurrentResolution(defaultResolution);
        } else {
          // If no video sources found, this will fall back to the original videoUrl
          console.log('No video sources found for video:', videoId);
        }
      } catch (err) {
        console.error('Error fetching video resolutions:', err);
        setError('Failed to load video resolutions');
        // Continue with fallback to original videoUrl
      } finally {
        setIsLoading(false);
      }
    };

    fetchResolutions();
  }, [videoId]);

  const switchResolution = (resolution: VideoResolution) => {
    // Process URL when switching resolution
    const urlInfo = analyzeVideoUrl(resolution.source_url);
    const processedUrl = urlInfo.needsEncoding ? encodeVideoUrl(resolution.source_url) : resolution.source_url;
    
    const processedResolution = {
      ...resolution,
      processed_url: processedUrl
    };
    
    setCurrentResolution(processedResolution);
  };

  return {
    resolutions,
    currentResolution,
    isLoading,
    error,
    switchResolution,
    hasMultipleResolutions: resolutions.length > 1,
  };
};