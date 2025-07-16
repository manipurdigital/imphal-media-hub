import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoResolution {
  id: string;
  resolution: string;
  quality_label: string;
  source_url: string;
  bitrate?: number;
  file_size?: number;
  is_default: boolean;
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

        setResolutions(data || []);
        
        // Set default resolution
        const defaultResolution = data?.find(r => r.is_default) || data?.[0];
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
    setCurrentResolution(resolution);
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