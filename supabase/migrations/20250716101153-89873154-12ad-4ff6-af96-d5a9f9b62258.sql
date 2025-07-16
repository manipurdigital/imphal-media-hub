-- Create comprehensive sample categories
INSERT INTO categories (name, slug, description, display_order, is_active) VALUES
('Action', 'action', 'High-octane thrillers and adventure films', 1, true),
('Comedy', 'comedy', 'Laugh-out-loud entertainment', 2, true),
('Drama', 'drama', 'Compelling character-driven stories', 3, true),
('Horror', 'horror', 'Spine-chilling suspense and scares', 4, true),
('Sci-Fi', 'sci-fi', 'Futuristic and science fiction content', 5, true),
('Romance', 'romance', 'Love stories and romantic comedies', 6, true),
('Thriller', 'thriller', 'Edge-of-your-seat suspense', 7, true),
('Documentary', 'documentary', 'Real-world stories and factual content', 8, true),
('Animation', 'animation', 'Animated movies and series', 9, true),
('Crime', 'crime', 'Criminal investigations and heist stories', 10, true),
('Fantasy', 'fantasy', 'Magical worlds and mythical adventures', 11, true),
('Family', 'family', 'Content suitable for all ages', 12, true)
ON CONFLICT (slug) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
display_order = EXCLUDED.display_order;

-- Create enhanced collections including Netflix-style categories
INSERT INTO collections (name, slug, description, display_order, is_featured, is_active) VALUES
('KangleiFlix Originals', 'kangleiflix-originals', 'Exclusive original content produced by KangleiFlix', 1, true, true),
('Trending Now', 'trending-now', 'Popular content everyone is watching', 2, true, true),
('New Releases', 'new-releases', 'Recently added movies and shows', 3, true, true),
('Top Rated', 'top-rated', 'Highest rated content on the platform', 4, true, true),
('Award Winners', 'award-winners', 'Award-winning movies and documentaries', 5, true, true),
('Binge-Worthy Series', 'binge-worthy-series', 'TV series perfect for marathon viewing', 6, false, true),
('Classic Movies', 'classic-movies', 'Timeless cinema from decades past', 7, false, true),
('International Cinema', 'international-cinema', 'Films from around the world', 8, false, true),
('Action Thrillers', 'action-thrillers', 'High-energy action and thriller movies', 9, false, true),
('Feel-Good Movies', 'feel-good-movies', 'Uplifting and heartwarming content', 10, false, true)
ON CONFLICT (slug) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
display_order = EXCLUDED.display_order,
is_featured = EXCLUDED.is_featured;

-- Insert comprehensive sample video content
INSERT INTO videos (
    title, description, genre, video_url, thumbnail_url, trailer_url,
    rating, year, production_year, duration, content_type, content_status,
    director, cast_members, view_count
) VALUES
-- KangleiFlix Originals
('The Last Kingdom', 'Epic historical drama following the story of Uhtred of Bebbanburg in medieval England. A tale of loyalty, betrayal, and the forging of a nation.', 'Historical Drama', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.8, 2023, 2023, 3600, 'series', 'published', 'Sarah Mitchell', ARRAY['Alexander Dreymon', 'Emily Cox', 'David Dawson'], 1250000),

('Neon Dreams', 'A cyberpunk thriller set in 2087 where memories can be stolen and reality is negotiable. Follow detective Maya Chen as she uncovers a conspiracy that threatens humanity.', 'Sci-Fi Thriller', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.6, 2024, 2024, 7200, 'movie', 'published', 'James Rodriguez', ARRAY['Zendaya', 'Oscar Isaac', 'Tilda Swinton'], 890000),

('Culinary Kingdoms', 'Master chefs from around the world compete in the ultimate cooking competition. Each episode takes place in a different country with local ingredients and traditional techniques.', 'Reality Competition', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.4, 2024, 2024, 2700, 'series', 'published', 'Gordon Ramsay', ARRAY['Gordon Ramsay', 'Padma Lakshmi', 'José Andrés'], 750000),

-- Trending Movies
('Quantum Heist', 'When a team of scientists discovers time travel, they plan the ultimate heist - stealing from the past to save the future. But changing history comes with deadly consequences.', 'Sci-Fi Action', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.5, 2024, 2024, 8100, 'movie', 'published', 'Christopher Nolan', ARRAY['Tom Hardy', 'Margot Robbie', 'Michael Caine'], 2100000),

('The Silent Forest', 'A psychological horror about a family who moves to a remote cabin, only to discover that the surrounding forest holds ancient secrets and something is hunting them.', 'Horror', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.2, 2024, 2024, 5400, 'movie', 'published', 'Ari Aster', ARRAY['Florence Pugh', 'Jack Reynor', 'William Jackson Harper'], 1800000),

('Love in Tokyo', 'A romantic comedy following an American chef who travels to Tokyo to learn traditional cuisine and falls in love with her Japanese instructor and the city itself.', 'Romantic Comedy', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.1, 2024, 2024, 6300, 'movie', 'published', 'Nancy Meyers', ARRAY['Emma Stone', 'John Cho', 'Sandra Oh'], 950000),

-- Classic Content
('The Great Escape', 'Classic war film about Allied prisoners planning a massive escape from a German POW camp during World War II. Based on true events.', 'War Drama', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.7, 1963, 1963, 10200, 'movie', 'published', 'John Sturges', ARRAY['Steve McQueen', 'James Garner', 'Richard Attenborough'], 3200000),

('Casablanca', 'The timeless romance set in wartime Morocco. Rick Blaine must choose between love and virtue when his former lover arrives with her resistance leader husband.', 'Romance Drama', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.9, 1942, 1942, 6120, 'movie', 'published', 'Michael Curtiz', ARRAY['Humphrey Bogart', 'Ingrid Bergman', 'Paul Henreid'], 5500000),

-- International Cinema
('Parasite', 'Korean black comedy thriller about class conflict and social inequality. A poor family schemes to become employed by a wealthy family.', 'Thriller Drama', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.8, 2019, 2019, 7920, 'movie', 'published', 'Bong Joon-ho', ARRAY['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'], 4200000),

('Amélie', 'French romantic comedy about a shy waitress who decides to help those around her find happiness, while discovering love herself in the streets of Montmartre.', 'Romantic Comedy', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.6, 2001, 2001, 7200, 'movie', 'published', 'Jean-Pierre Jeunet', ARRAY['Audrey Tautou', 'Mathieu Kassovitz', 'Rufus'], 2800000),

-- TV Series
('Crown of Thorns', 'Political drama series following the rise and fall of a fictional royal dynasty through three generations of power, betrayal, and family secrets.', 'Political Drama', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.7, 2023, 2023, 3000, 'series', 'published', 'Peter Morgan', ARRAY['Claire Foy', 'Matt Smith', 'Vanessa Kirby'], 3500000),

('Tech Titans', 'Drama series about the competitive world of Silicon Valley startups, following entrepreneurs as they build empires and destroy lives in pursuit of the next big thing.', 'Business Drama', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.3, 2024, 2024, 2700, 'series', 'published', 'Aaron Sorkin', ARRAY['Jesse Eisenberg', 'Rooney Mara', 'Justin Timberlake'], 1900000),

-- Documentaries
('Ocean Mysteries', 'Breathtaking documentary series exploring the deepest parts of our oceans, featuring never-before-seen creatures and underwater ecosystems.', 'Nature Documentary', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.9, 2024, 2024, 2700, 'documentary', 'published', 'David Attenborough', ARRAY['David Attenborough'], 2200000),

('The Last Innovators', 'Documentary about the final generation of tech pioneers who built the internet as we know it, featuring exclusive interviews and never-seen footage.', 'Technology Documentary', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.5, 2023, 2023, 5400, 'documentary', 'published', 'Alex Gibney', ARRAY['Tim Berners-Lee', 'Vint Cerf', 'Steve Wozniak'], 1100000),

-- Animation
('Dragon Realms', 'Animated fantasy adventure following a young dragon keeper who must unite the scattered dragon clans to save their magical world from an ancient evil.', 'Fantasy Animation', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.4, 2024, 2024, 5400, 'movie', 'published', 'Pete Docter', ARRAY['Tom Holland', 'Zendaya', 'Morgan Freeman'], 1650000),

('Future Heroes', 'Animated superhero series set in 2150, where a new generation of heroes must protect Earth from interdimensional threats using advanced technology.', 'Superhero Animation', 'https://sample-videos.com/zip/10/mp4/mp4-1920x1080-sample.mp4', '/api/placeholder/400/600', 'https://sample-videos.com/zip/10/mp4/mp4-640x360-sample.mp4', 4.2, 2024, 2024, 1350, 'series', 'published', 'Lauren Montgomery', ARRAY['Miles Morales', 'Gwen Stacy', 'Peter Parker'], 980000);

-- Now let's create the relationships between videos and categories
WITH video_category_mappings AS (
  SELECT 
    v.id as video_id,
    c.id as category_id
  FROM videos v
  CROSS JOIN categories c
  WHERE 
    (v.title = 'The Last Kingdom' AND c.slug IN ('drama', 'action')) OR
    (v.title = 'Neon Dreams' AND c.slug IN ('sci-fi', 'thriller')) OR
    (v.title = 'Culinary Kingdoms' AND c.slug IN ('documentary', 'family')) OR
    (v.title = 'Quantum Heist' AND c.slug IN ('sci-fi', 'action', 'thriller')) OR
    (v.title = 'The Silent Forest' AND c.slug IN ('horror', 'thriller')) OR
    (v.title = 'Love in Tokyo' AND c.slug IN ('romance', 'comedy')) OR
    (v.title = 'The Great Escape' AND c.slug IN ('drama', 'action')) OR
    (v.title = 'Casablanca' AND c.slug IN ('romance', 'drama')) OR
    (v.title = 'Parasite' AND c.slug IN ('thriller', 'drama', 'crime')) OR
    (v.title = 'Amélie' AND c.slug IN ('romance', 'comedy')) OR
    (v.title = 'Crown of Thorns' AND c.slug IN ('drama')) OR
    (v.title = 'Tech Titans' AND c.slug IN ('drama')) OR
    (v.title = 'Ocean Mysteries' AND c.slug IN ('documentary')) OR
    (v.title = 'The Last Innovators' AND c.slug IN ('documentary')) OR
    (v.title = 'Dragon Realms' AND c.slug IN ('animation', 'fantasy', 'family')) OR
    (v.title = 'Future Heroes' AND c.slug IN ('animation', 'action', 'family'))
)
INSERT INTO video_categories (video_id, category_id)
SELECT video_id, category_id FROM video_category_mappings
ON CONFLICT DO NOTHING;

-- Create video-collection relationships
WITH video_collection_mappings AS (
  SELECT 
    v.id as video_id,
    c.id as collection_id,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY v.view_count DESC) as display_order
  FROM videos v
  CROSS JOIN collections c
  WHERE 
    (c.slug = 'kangleiflix-originals' AND v.title IN ('The Last Kingdom', 'Neon Dreams', 'Culinary Kingdoms')) OR
    (c.slug = 'trending-now' AND v.title IN ('Quantum Heist', 'The Silent Forest', 'Love in Tokyo', 'Crown of Thorns')) OR
    (c.slug = 'new-releases' AND v.title IN ('Neon Dreams', 'Quantum Heist', 'The Silent Forest', 'Love in Tokyo', 'Dragon Realms', 'Future Heroes')) OR
    (c.slug = 'top-rated' AND v.title IN ('Ocean Mysteries', 'Casablanca', 'The Last Kingdom', 'The Great Escape', 'Parasite')) OR
    (c.slug = 'award-winners' AND v.title IN ('Parasite', 'Casablanca', 'The Great Escape', 'Ocean Mysteries')) OR
    (c.slug = 'binge-worthy-series' AND v.content_type = 'series') OR
    (c.slug = 'classic-movies' AND v.title IN ('Casablanca', 'The Great Escape')) OR
    (c.slug = 'international-cinema' AND v.title IN ('Parasite', 'Amélie')) OR
    (c.slug = 'action-thrillers' AND v.title IN ('Quantum Heist', 'The Silent Forest', 'Neon Dreams')) OR
    (c.slug = 'feel-good-movies' AND v.title IN ('Love in Tokyo', 'Amélie', 'Dragon Realms'))
)
INSERT INTO video_collections (video_id, collection_id, display_order)
SELECT video_id, collection_id, display_order FROM video_collection_mappings
ON CONFLICT DO NOTHING;