-- Add is_featured column to videos table
ALTER TABLE public.videos 
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create unique partial index to ensure only one video can be featured
CREATE UNIQUE INDEX idx_videos_featured_unique 
ON public.videos (is_featured) 
WHERE is_featured = true;

-- Create function to set featured video (automatically unfeatures others)
CREATE OR REPLACE FUNCTION public.set_featured_video(_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Unfeature all videos first
  UPDATE videos SET is_featured = false WHERE is_featured = true;
  
  -- Feature the selected video
  UPDATE videos SET is_featured = true WHERE id = _video_id;
END;
$$;