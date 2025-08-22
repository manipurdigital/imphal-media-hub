-- Update the video access control function to properly handle subscription vs PPV access
CREATE OR REPLACE FUNCTION public.get_video_with_access_control(video_uuid uuid)
 RETURNS TABLE(id uuid, title text, description text, genre text, content_type content_type, year integer, duration integer, rating numeric, director text, cast_members text[], video_url text, thumbnail_url text, trailer_url text, is_premium boolean, content_status content_status, view_count integer, created_at timestamp with time zone, can_watch boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  video_record RECORD;
  user_can_watch BOOLEAN := false;
  return_video_url TEXT := null;
  is_ppv_content BOOLEAN := false;
BEGIN
  -- Get the video record
  SELECT * INTO video_record
  FROM videos v
  WHERE v.id = video_uuid
  AND v.content_status = 'published';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check if this video has pay-per-view content associated with it
  SELECT EXISTS(
    SELECT 1 FROM pay_per_view_content 
    WHERE video_id = video_record.id AND is_active = true
  ) INTO is_ppv_content;
  
  -- Access control logic
  IF is_ppv_content THEN
    -- For PPV videos: Only PPV purchase grants access (subscription not required)
    IF check_pay_per_view_access(auth.uid(), video_record.id) THEN
      user_can_watch := true;
      return_video_url := video_record.video_url;
    END IF;
  ELSE
    -- For regular videos: Active subscription required
    IF has_active_subscription(auth.uid()) THEN
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
$function$;

-- Update the PPV content visibility policy to allow subscribers to see PPV content 
-- (but not necessarily watch it without purchase)
DROP POLICY IF EXISTS "Subscribers can view pay-per-view content" ON pay_per_view_content;

CREATE POLICY "Users can view pay-per-view content catalog" 
ON pay_per_view_content 
FOR SELECT 
USING (is_active = true);

-- Create a function to get PPV content with user purchase status
CREATE OR REPLACE FUNCTION public.get_pay_per_view_content_with_purchase_status(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, video_id uuid, title text, description text, price numeric, currency character varying, duration_minutes integer, thumbnail_url text, preview_url text, is_purchased boolean, purchase_status character varying, purchased_at timestamp with time zone, can_watch boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ppvc.id,
        ppvc.video_id,
        ppvc.title,
        ppvc.description,
        ppvc.price,
        ppvc.currency,
        ppvc.duration_minutes,
        ppvc.thumbnail_url,
        ppvc.preview_url,
        COALESCE(up.payment_status = 'completed', false) as is_purchased,
        COALESCE(up.payment_status, 'not_purchased') as purchase_status,
        up.purchased_at,
        COALESCE(up.payment_status = 'completed' AND up.is_active = true AND (up.expires_at IS NULL OR up.expires_at > now()), false) as can_watch
    FROM pay_per_view_content ppvc
    LEFT JOIN user_purchases up ON ppvc.id = up.content_id AND up.user_id = p_user_id
    WHERE ppvc.is_active = true
    ORDER BY ppvc.created_at DESC;
END;
$function$;