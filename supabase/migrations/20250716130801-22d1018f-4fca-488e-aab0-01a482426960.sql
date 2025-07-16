-- Mark external videos hosted on commondatastorage.googleapis.com as CORS blocked
UPDATE videos 
SET accessibility_status = 'cors_blocked',
    accessibility_checked_at = now()
WHERE hosting_type = 'external' 
AND video_url LIKE '%commondatastorage.googleapis.com%';

-- Remove all unplayable videos (CORS blocked and not found)
DELETE FROM videos 
WHERE accessibility_status IN ('cors_blocked', 'not_found');

-- Clean up orphaned related data
DELETE FROM video_sources WHERE video_id NOT IN (SELECT id FROM videos);
DELETE FROM video_categories WHERE video_id NOT IN (SELECT id FROM videos);
DELETE FROM video_collections WHERE video_id NOT IN (SELECT id FROM videos);
DELETE FROM video_tags WHERE video_id NOT IN (SELECT id FROM videos);
DELETE FROM user_favorites WHERE video_id NOT IN (SELECT id FROM videos);