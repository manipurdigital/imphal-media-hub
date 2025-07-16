-- Add playable sample videos
INSERT INTO videos (title, description, video_url, genre, thumbnail_url, hosting_type, accessibility_status, content_type, content_status, year, rating) VALUES
-- YouTube Videos (always playable)
('Big Buck Bunny', 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.', 'https://www.youtube.com/watch?v=YE7VzlLtp-4', 'Animation', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop', 'youtube', 'accessible', 'movie', 'published', 2008, 8.2),

('Sintel - Open Movie', 'A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales. But when he is kidnapped by an adult dragon, Sintel decides to embark on a dangerous quest to find her lost friend Scales.', 'https://www.youtube.com/watch?v=eRsGyueVLvQ', 'Fantasy', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=450&fit=crop', 'youtube', 'accessible', 'movie', 'published', 2010, 7.8),

('Tears of Steel', 'In an apocalyptic future, a group of soldiers and scientists takes refuge in Amsterdam to try to stop an army of robots that threatens humanity.', 'https://www.youtube.com/watch?v=R6MlUcmOul8', 'Sci-Fi', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop', 'youtube', 'accessible', 'movie', 'published', 2012, 7.5),

('Elephant Dream', 'The story of two strange characters exploring a capricious and seemingly infinite machine. The elder, Proog, acts as a tour-guide and protector, happily showing off the sights and dangers of the machine to his initially curious but increasingly skeptical protege Emo.', 'https://www.youtube.com/watch?v=TLkA0RELQ1g', 'Animation', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=450&fit=crop', 'youtube', 'accessible', 'movie', 'published', 2006, 7.0),

-- More diverse content
('Coding Tutorial: React Basics', 'Learn the fundamentals of React.js in this comprehensive tutorial for beginners.', 'https://www.youtube.com/watch?v=SqcY0GlETPk', 'Educational', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop', 'youtube', 'accessible', 'documentary', 'published', 2023, 8.5),

('Nature Documentary: Ocean Life', 'Explore the fascinating world beneath the waves and discover amazing marine creatures.', 'https://www.youtube.com/watch?v=IUN664s7N-c', 'Documentary', 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop', 'youtube', 'accessible', 'documentary', 'published', 2022, 9.1),

('Music Video: Ambient Sounds', 'Relaxing ambient music perfect for study, work, or meditation.', 'https://www.youtube.com/watch?v=1ZYbU82GVz4', 'Music', 'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=800&h=450&fit=crop', 'youtube', 'accessible', 'short', 'published', 2023, 8.0),

-- Web-safe video URLs (these typically work with CORS)
('Sample Demo Video', 'A sample demonstration video showcasing modern web technologies.', 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 'Technology', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop', 'external', 'unknown', 'short', 'published', 2023, 7.5),

('Wildlife Documentary Clip', 'Beautiful footage of wildlife in their natural habitat.', 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', 'Documentary', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=450&fit=crop', 'external', 'unknown', 'short', 'published', 2023, 8.3),

('Tech Review: Latest Gadgets', 'Comprehensive review of the latest technology gadgets and innovations.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'Technology', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop', 'external', 'unknown', 'documentary', 'published', 2023, 7.8);

-- Update video accessibility status for the new external videos
UPDATE videos 
SET accessibility_status = 'cors_blocked', accessibility_checked_at = now()
WHERE hosting_type = 'external' 
AND video_url LIKE '%commondatastorage.googleapis.com%';