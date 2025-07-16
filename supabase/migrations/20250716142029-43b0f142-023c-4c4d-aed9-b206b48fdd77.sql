-- Update video hosting type trigger to include Vimeo support
-- First drop the existing trigger properly
DROP TRIGGER IF EXISTS trigger_update_video_hosting_type ON videos;
DROP TRIGGER IF EXISTS update_video_hosting_type_trigger ON videos;

-- Then drop and recreate the function
DROP FUNCTION IF EXISTS update_video_hosting_type() CASCADE;

CREATE OR REPLACE FUNCTION public.update_video_hosting_type()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.video_url ~* '^https://zzulxowwlqndtrlmfnij\.supabase\.co/' THEN
    NEW.hosting_type = 'supabase';
    NEW.accessibility_status = 'accessible';
  ELSIF NEW.video_url ~* '(youtube\.com|youtu\.be)' THEN
    NEW.hosting_type = 'youtube';
    NEW.accessibility_status = 'accessible';
  ELSIF NEW.video_url ~* '(vimeo\.com|player\.vimeo\.com)' THEN
    NEW.hosting_type = 'vimeo';
    NEW.accessibility_status = 'accessible';
  ELSE
    NEW.hosting_type = 'external';
    NEW.accessibility_status = 'unknown';
  END IF;
  
  NEW.accessibility_checked_at = now();
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER trigger_update_video_hosting_type
    BEFORE INSERT OR UPDATE ON videos
    FOR EACH ROW
    EXECUTE FUNCTION update_video_hosting_type();

-- Update existing videos to set proper hosting type for Vimeo videos
UPDATE videos 
SET hosting_type = 'vimeo', 
    accessibility_status = 'accessible',
    accessibility_checked_at = now()
WHERE video_url ~* '(vimeo\.com|player\.vimeo\.com)' 
AND hosting_type != 'vimeo';