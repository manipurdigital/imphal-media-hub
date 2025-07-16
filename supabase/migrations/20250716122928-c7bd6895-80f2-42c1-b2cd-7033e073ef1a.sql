-- Create video_sources table for multiple resolution support
CREATE TABLE public.video_sources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL,
    resolution TEXT NOT NULL,
    quality_label TEXT NOT NULL,
    source_url TEXT NOT NULL,
    bitrate INTEGER,
    file_size BIGINT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT video_sources_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Video sources are viewable by everyone" 
ON public.video_sources 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage video sources" 
ON public.video_sources 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_video_sources_video_id ON public.video_sources(video_id);
CREATE INDEX idx_video_sources_is_default ON public.video_sources(is_default);
CREATE INDEX idx_video_sources_resolution ON public.video_sources(resolution);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_video_sources_updated_at
BEFORE UPDATE ON public.video_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing videos to video_sources table
-- This creates a default resolution entry for each existing video
INSERT INTO public.video_sources (video_id, resolution, quality_label, source_url, is_default)
SELECT 
    id,
    '720p',
    'Standard',
    video_url,
    true
FROM public.videos
WHERE video_url IS NOT NULL AND video_url != '';

-- For demonstration, let's add some sample additional resolutions for a few videos
-- This would normally be done through the admin interface
INSERT INTO public.video_sources (video_id, resolution, quality_label, source_url, is_default)
SELECT 
    id,
    '1080p',
    'HD',
    video_url, -- In real implementation, this would be different URLs
    false
FROM public.videos
WHERE video_url IS NOT NULL AND video_url != ''
LIMIT 3;

INSERT INTO public.video_sources (video_id, resolution, quality_label, source_url, is_default)
SELECT 
    id,
    '480p',
    'Low',
    video_url, -- In real implementation, this would be different URLs
    false
FROM public.videos
WHERE video_url IS NOT NULL AND video_url != ''
LIMIT 3;