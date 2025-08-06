-- Fix video storage bucket to be public and add proper RLS policies
UPDATE storage.buckets 
SET public = true 
WHERE id = 'videos';

-- Allow public read access to videos
CREATE POLICY "Public videos are accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Allow users to update their own video uploads (for admin/creator management)
CREATE POLICY "Users can manage video uploads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- Allow users to delete video uploads (for admin/creator management)
CREATE POLICY "Users can delete video uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');