-- First, remove duplicate entries in pay_per_view_content table
-- Keep only the most recent entry for each video_id
DELETE FROM pay_per_view_content 
WHERE id NOT IN (
    SELECT DISTINCT ON (video_id) id
    FROM pay_per_view_content
    ORDER BY video_id, created_at DESC
);

-- Now add the unique constraint on video_id
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