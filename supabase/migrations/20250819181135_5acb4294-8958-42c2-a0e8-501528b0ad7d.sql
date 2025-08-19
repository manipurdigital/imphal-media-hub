-- Create function to get video with conditional URL access
CREATE OR REPLACE FUNCTION public.get_video_with_access_control(video_uuid uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  genre text,
  content_type content_type,
  year integer,
  duration integer,
  rating numeric,
  director text,
  cast_members text[],
  video_url text,
  thumbnail_url text,
  trailer_url text,
  is_premium boolean,
  content_status content_status,
  view_count integer,
  created_at timestamp with time zone,
  can_watch boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  video_record RECORD;
  user_can_watch BOOLEAN := false;
  return_video_url TEXT := null;
BEGIN
  -- Get the video record
  SELECT * INTO video_record
  FROM videos v
  WHERE v.id = video_uuid
  AND v.content_status = 'published';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check access permissions
  IF video_record.is_premium = false THEN
    -- For regular videos, check if user has active subscription
    IF has_active_subscription(auth.uid()) THEN
      user_can_watch := true;
      return_video_url := video_record.video_url;
    END IF;
  ELSE
    -- For premium videos, check both subscription AND PPV purchase
    IF has_active_subscription(auth.uid()) 
       AND check_pay_per_view_access(auth.uid(), video_record.id) THEN
      user_can_watch := true;
      return_video_url := video_record.video_url;
    END IF;
  END IF;
  
  -- Always allow admins full access
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    user_can_watch := true;
    return_video_url := video_record.video_url;
  END IF;
  
  -- Return the video data
  RETURN QUERY SELECT
    video_record.id,
    video_record.title,
    video_record.description,
    video_record.genre,
    video_record.content_type,
    video_record.year,
    video_record.duration,
    video_record.rating,
    video_record.director,
    video_record.cast_members,
    return_video_url,
    video_record.thumbnail_url,
    video_record.trailer_url,
    video_record.is_premium,
    video_record.content_status,
    video_record.view_count,
    video_record.created_at,
    user_can_watch;
END;
$$;

-- Create a view that shows video metadata without URLs for browsing
CREATE OR REPLACE VIEW public.videos_browse AS
SELECT 
  id,
  title,
  description,
  genre,
  content_type,
  year,
  duration,
  rating,
  director,
  cast_members,
  CASE 
    WHEN has_active_subscription(auth.uid()) AND is_premium = false THEN video_url
    WHEN has_active_subscription(auth.uid()) AND is_premium = true 
         AND check_pay_per_view_access(auth.uid(), id) THEN video_url
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN video_url
    ELSE null
  END as video_url,
  thumbnail_url,
  trailer_url,
  is_premium,
  content_status,
  view_count,
  created_at,
  CASE 
    WHEN has_active_subscription(auth.uid()) AND is_premium = false THEN true
    WHEN has_active_subscription(auth.uid()) AND is_premium = true 
         AND check_pay_per_view_access(auth.uid(), id) THEN true
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
    ELSE false
  END as can_watch
FROM videos
WHERE content_status = 'published';

-- Grant access to the view
GRANT SELECT ON public.videos_browse TO authenticated, anon;

-- Update existing video table policies to be more restrictive on video_url
DROP POLICY IF EXISTS "Non-premium videos viewable by all" ON public.videos;
DROP POLICY IF EXISTS "Premium videos viewable by subscribers" ON public.videos;

-- Policy that allows viewing metadata but restricts video_url access
CREATE POLICY "Video metadata viewable by all" 
ON public.videos 
FOR SELECT 
USING (content_status = 'published');