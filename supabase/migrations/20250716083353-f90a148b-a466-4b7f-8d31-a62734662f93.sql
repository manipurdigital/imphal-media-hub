-- Enhanced Video Metadata & Categories Implementation

-- Create enum for content status
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for content type
CREATE TYPE content_type AS ENUM ('movie', 'series', 'documentary', 'short', 'trailer');

-- Add new columns to videos table
ALTER TABLE videos 
ADD COLUMN cast TEXT[],
ADD COLUMN director TEXT,
ADD COLUMN production_year INTEGER,
ADD COLUMN trailer_url TEXT,
ADD COLUMN content_status content_status DEFAULT 'published',
ADD COLUMN content_type content_type DEFAULT 'movie',
ADD COLUMN search_vector tsvector;

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for video categories
CREATE TABLE video_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(video_id, category_id)
);

-- Create junction table for video collections
CREATE TABLE video_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(video_id, collection_id)
);

-- Create junction table for video tags
CREATE TABLE video_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(video_id, tag_id)
);

-- Enable RLS on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Collections are viewable by everyone" ON collections FOR SELECT USING (true);
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Video categories are viewable by everyone" ON video_categories FOR SELECT USING (true);
CREATE POLICY "Video collections are viewable by everyone" ON video_collections FOR SELECT USING (true);
CREATE POLICY "Video tags are viewable by everyone" ON video_tags FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_videos_content_status ON videos(content_status);
CREATE INDEX idx_videos_content_type ON videos(content_type);
CREATE INDEX idx_videos_production_year ON videos(production_year);
CREATE INDEX idx_videos_search_vector ON videos USING gin(search_vector);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_display_order ON collections(display_order);
CREATE INDEX idx_collections_featured ON collections(is_featured);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_video_categories_video_id ON video_categories(video_id);
CREATE INDEX idx_video_categories_category_id ON video_categories(category_id);
CREATE INDEX idx_video_collections_video_id ON video_collections(video_id);
CREATE INDEX idx_video_collections_collection_id ON video_collections(collection_id);
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_video_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.genre, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.cast, ' '), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.director, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER update_videos_search_vector
    BEFORE INSERT OR UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_video_search_vector();

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories
INSERT INTO categories (name, slug, description, display_order) VALUES
('Action', 'action', 'High-energy films with exciting sequences', 1),
('Comedy', 'comedy', 'Films designed to entertain and amuse', 2),
('Drama', 'drama', 'Character-driven stories with emotional depth', 3),
('Horror', 'horror', 'Films designed to frighten and create suspense', 4),
('Romance', 'romance', 'Love stories and romantic relationships', 5),
('Sci-Fi', 'sci-fi', 'Science fiction and futuristic themes', 6),
('Thriller', 'thriller', 'Suspenseful and tension-filled stories', 7),
('Documentary', 'documentary', 'Non-fiction films and educational content', 8);

-- Insert some default collections
INSERT INTO collections (name, slug, description, is_featured, display_order) VALUES
('Featured', 'featured', 'Hand-picked premium content', true, 1),
('Trending Now', 'trending', 'Most popular content right now', true, 2),
('New Releases', 'new-releases', 'Latest additions to our catalog', true, 3),
('Staff Picks', 'staff-picks', 'Recommended by our content team', false, 4),
('Classic Films', 'classics', 'Timeless movies and shows', false, 5);

-- Update existing videos search vectors
UPDATE videos SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(genre, '')), 'C');