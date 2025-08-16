-- Fix pay-per-view content table constraints
-- Add unique constraint on video_id to prevent duplicate pay-per-view entries for the same video
ALTER TABLE pay_per_view_content 
ADD CONSTRAINT pay_per_view_content_video_id_key UNIQUE (video_id);

-- Update the trigger function to handle the unique constraint properly
CREATE OR REPLACE FUNCTION public.create_pay_per_view_for_premium_video()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- If video is marked as premium, create pay-per-view content
  IF NEW.is_premium = true THEN
    INSERT INTO pay_per_view_content (
      video_id,
      title,
      description,
      price,
      currency,
      duration_minutes,
      thumbnail_url,
      is_active
    ) VALUES (
      NEW.id,
      NEW.title,
      COALESCE(NEW.description, 'Premium content'),
      99.00, -- Default price
      'INR',
      COALESCE(NEW.duration, 120),
      COALESCE(NEW.thumbnail_url, '/placeholder.svg'),
      true
    )
    ON CONFLICT (video_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      thumbnail_url = EXCLUDED.thumbnail_url,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;