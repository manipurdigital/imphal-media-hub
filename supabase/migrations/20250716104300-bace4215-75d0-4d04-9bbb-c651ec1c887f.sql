-- Create comprehensive RLS policies for storage buckets to enable file uploads

-- Enable RLS on storage.objects (should already be enabled, but ensuring it)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for videos bucket
CREATE POLICY "Users can upload videos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Users can view videos" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'videos');

CREATE POLICY "Users can update their videos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'videos' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete their videos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'videos' AND auth.uid()::text = owner);

-- Policies for thumbnails bucket  
CREATE POLICY "Users can upload thumbnails" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Users can view thumbnails" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can update their thumbnails" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'thumbnails' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete their thumbnails" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'thumbnails' AND auth.uid()::text = owner);

-- Allow public access to view objects in both buckets (since buckets are public)
CREATE POLICY "Public can view videos" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'videos');

CREATE POLICY "Public can view thumbnails" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'thumbnails');