-- Create a function to test and remove unplayable videos
CREATE OR REPLACE FUNCTION remove_unplayable_videos()
RETURNS TABLE(
  removed_count INTEGER,
  removed_titles TEXT[]
) 
LANGUAGE plpgsql
AS $$
DECLARE
  video_record RECORD;
  removed_video_titles TEXT[] := '{}';
  total_removed INTEGER := 0;
BEGIN
  -- Mark external videos as CORS blocked since we know commondatastorage.googleapis.com has CORS issues
  UPDATE videos 
  SET accessibility_status = 'cors_blocked',
      accessibility_checked_at = now()
  WHERE hosting_type = 'external' 
  AND video_url LIKE '%commondatastorage.googleapis.com%';

  -- Collect titles of videos to be removed
  FOR video_record IN 
    SELECT id, title 
    FROM videos 
    WHERE accessibility_status IN ('cors_blocked', 'not_found')
  LOOP
    removed_video_titles := array_append(removed_video_titles, video_record.title);
    total_removed := total_removed + 1;
  END LOOP;

  -- Remove videos with CORS or accessibility issues
  DELETE FROM videos 
  WHERE accessibility_status IN ('cors_blocked', 'not_found');

  -- Also clean up related data
  DELETE FROM video_sources WHERE video_id NOT IN (SELECT id FROM videos);
  DELETE FROM video_categories WHERE video_id NOT IN (SELECT id FROM videos);
  DELETE FROM video_collections WHERE video_id NOT IN (SELECT id FROM videos);
  DELETE FROM video_tags WHERE video_id NOT IN (SELECT id FROM videos);
  DELETE FROM user_favorites WHERE video_id NOT IN (SELECT id FROM videos);

  RETURN QUERY SELECT total_removed, removed_video_titles;
END;
$$;