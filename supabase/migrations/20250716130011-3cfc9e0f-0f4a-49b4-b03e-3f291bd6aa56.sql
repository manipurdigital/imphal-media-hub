-- Add video accessibility tracking to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS accessibility_status TEXT DEFAULT 'unknown' CHECK (accessibility_status IN ('accessible', 'cors_blocked', 'not_found', 'unknown', 'testing'));

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS accessibility_checked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS hosting_type TEXT DEFAULT 'external' CHECK (hosting_type IN ('supabase', 'youtube', 'external'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_videos_accessibility ON videos(accessibility_status, hosting_type);

-- Create a function to update hosting type based on video_url
CREATE OR REPLACE FUNCTION update_video_hosting_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.video_url ~* '^https://zzulxowwlqndtrlmfnij\.supabase\.co/' THEN
    NEW.hosting_type = 'supabase';
    NEW.accessibility_status = 'accessible';
  ELSIF NEW.video_url ~* '(youtube\.com|youtu\.be)' THEN
    NEW.hosting_type = 'youtube';
    NEW.accessibility_status = 'accessible';
  ELSE
    NEW.hosting_type = 'external';
    NEW.accessibility_status = 'unknown';
  END IF;
  
  NEW.accessibility_checked_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic hosting type detection
DROP TRIGGER IF EXISTS trigger_update_video_hosting_type ON videos;
CREATE TRIGGER trigger_update_video_hosting_type
  BEFORE INSERT OR UPDATE OF video_url ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_video_hosting_type();

-- Update existing videos with hosting types
UPDATE videos SET video_url = video_url; -- Trigger the update function