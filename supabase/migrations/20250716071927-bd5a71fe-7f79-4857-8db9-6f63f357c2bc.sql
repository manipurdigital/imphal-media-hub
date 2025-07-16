-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  genre TEXT NOT NULL,
  year INTEGER,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 10),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to view videos (public content)
CREATE POLICY "Videos are viewable by everyone" 
ON public.videos 
FOR SELECT 
USING (true);

-- Create storage bucket for video content
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Create storage policies for video bucket
CREATE POLICY "Video files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

-- Create storage policies for thumbnails bucket  
CREATE POLICY "Thumbnail images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample video data with free video URLs
INSERT INTO public.videos (title, description, video_url, thumbnail_url, duration, genre, year, rating) VALUES
('Big Buck Bunny', 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', 596, 'Animation', 2008, 8.2),
('Elephant Dream', 'The story of two strange characters exploring a capricious and seemingly infinite machine.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', 653, 'Animation', 2006, 7.8),
('For Bigger Blazes', 'HBO GO now works with Chromecast -- the easiest way to enjoy online video on your TV.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', 15, 'Documentary', 2013, 6.5),
('Sintel', 'A lonely young woman, Sintel, helps and befriends a dragon, whom she calls Scales.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', 888, 'Fantasy', 2010, 8.7),
('Tears of Steel', 'A group of warriors and scientists must fight to protect their city from a swarm of robots.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg', 734, 'Sci-Fi', 2012, 7.9),
('What car?', 'A vintage car commercial showcasing classic automobile design.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/WhatCarCanYouGetForAGrand.jpg', 60, 'Commercial', 2010, 6.8);