-- Remove unique constraint to allow multiple featured videos
DROP INDEX IF EXISTS idx_videos_featured_unique;

-- Update the set_featured_video function to add to featured instead of replacing
CREATE OR REPLACE FUNCTION public.set_featured_video(_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simply set the video as featured (don't unfeature others)
  UPDATE videos SET is_featured = true WHERE id = _video_id;
END;
$$;

-- Create function to unfeature a video
CREATE OR REPLACE FUNCTION public.unset_featured_video(_video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE videos SET is_featured = false WHERE id = _video_id;
END;
$$;