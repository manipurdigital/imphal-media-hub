-- Phase 1: Database Consistency - Ensure ALL Supabase videos have video_sources entries

-- First, let's create video_sources entries for ALL Supabase videos that don't have them
INSERT INTO video_sources (video_id, resolution, quality_label, source_url, is_default)
SELECT 
  v.id,
  '720p' as resolution,
  'Standard' as quality_label,
  v.video_url as source_url,
  true as is_default
FROM videos v
WHERE v.hosting_type = 'supabase' 
AND v.id NOT IN (SELECT DISTINCT video_id FROM video_sources WHERE video_id IS NOT NULL);

-- Create a function to validate video URL accessibility
CREATE OR REPLACE FUNCTION public.validate_video_url_accessibility()
RETURNS TABLE(
  video_id UUID,
  video_title TEXT,
  video_url TEXT,
  hosting_type TEXT,
  needs_check BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.title,
    v.video_url,
    v.hosting_type,
    CASE 
      WHEN v.hosting_type = 'supabase' AND v.accessibility_status = 'unknown' THEN true
      WHEN v.hosting_type = 'external' AND v.accessibility_status = 'unknown' THEN true
      ELSE false
    END as needs_check
  FROM videos v
  WHERE v.accessibility_status = 'unknown'
  ORDER BY v.created_at DESC;
END;
$$;

-- Create a function to check and fix video_sources consistency
CREATE OR REPLACE FUNCTION public.fix_video_sources_consistency()
RETURNS TABLE(
  action TEXT,
  video_id UUID,
  video_title TEXT,
  message TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  video_record RECORD;
  sources_count INTEGER;
BEGIN
  -- Check each video for missing video_sources
  FOR video_record IN 
    SELECT v.id, v.title, v.video_url, v.hosting_type
    FROM videos v
    ORDER BY v.created_at DESC
  LOOP
    -- Count existing video_sources for this video
    SELECT COUNT(*) INTO sources_count
    FROM video_sources vs
    WHERE vs.video_id = video_record.id;
    
    -- If no sources exist, create a default one
    IF sources_count = 0 THEN
      INSERT INTO video_sources (video_id, resolution, quality_label, source_url, is_default)
      VALUES (
        video_record.id,
        '720p',
        'Standard',
        video_record.video_url,
        true
      );
      
      RETURN QUERY SELECT 
        'CREATED'::TEXT, 
        video_record.id, 
        video_record.title, 
        'Created missing video_sources entry'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'EXISTS'::TEXT, 
        video_record.id, 
        video_record.title, 
        format('Already has %s video_sources entries', sources_count)::TEXT;
    END IF;
  END LOOP;
END;
$$;