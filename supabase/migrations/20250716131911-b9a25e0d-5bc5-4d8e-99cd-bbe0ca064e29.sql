-- Create video_sources entries for Supabase videos that don't have them
INSERT INTO video_sources (video_id, resolution, quality_label, source_url, is_default)
SELECT 
  v.id,
  '720p' as resolution,
  'Standard' as quality_label,
  v.video_url as source_url,
  true as is_default
FROM videos v
WHERE v.hosting_type = 'supabase' 
AND v.id NOT IN (SELECT DISTINCT video_id FROM video_sources);