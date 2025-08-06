-- Clean up broken RLS policies that reference the dropped profiles.role column
-- and consolidate into clean, working policies

-- Drop all broken policies that reference profiles.role
DROP POLICY IF EXISTS "Admin full access" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update any video" ON public.videos;
DROP POLICY IF EXISTS "Allow admins to delete videos" ON public.videos;
DROP POLICY IF EXISTS "Allow only admins to delete videos" ON public.videos;
DROP POLICY IF EXISTS "Creators or Admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Only admins can update videos" ON public.videos;

-- Drop dangerous "allow all authenticated users" policy
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.videos;

-- Drop redundant policies (keep the newer ones)
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;

-- Keep these working policies:
-- "Admins can manage all videos" - uses has_role() function
-- "Creator can manage their own videos" - uses creator_id
-- "Creators can update their own videos" - uses creator_id
-- "Public can read published videos" - for public access
-- "Users can view published videos" - combines public + admin access

-- Add missing policies for proper CRUD operations using the new role system
CREATE POLICY "Admins can insert videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators can insert videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'user'::app_role) AND auth.uid() IS NOT NULL);