-- Security Fix Migration: Consolidate role management and clean up RLS policies

-- Step 1: Remove conflicting role column from profiles table
-- We'll use the user_roles table as the single source of truth
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Step 2: Clean up redundant and conflicting RLS policies on videos table
-- Drop all existing video policies first
DROP POLICY IF EXISTS "Admin full access" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can manage all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update any video" ON public.videos;
DROP POLICY IF EXISTS "Allow admins to delete videos" ON public.videos;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Allow only admins to delete videos" ON public.videos;
DROP POLICY IF EXISTS "Creator can manage their own videos" ON public.videos;
DROP POLICY IF EXISTS "Creators can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Creators or Admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Only admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Only admins can update videos" ON public.videos;
DROP POLICY IF EXISTS "Public can read published videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view published videos" ON public.videos;
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;

-- Step 3: Create clean, secure RLS policies for videos
-- Public read access for published videos
CREATE POLICY "Public can view published videos"
ON public.videos
FOR SELECT
USING (content_status = 'published'::content_status);

-- Admin full access via role system
CREATE POLICY "Admins have full access"
ON public.videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Creators can manage their own videos
CREATE POLICY "Creators manage own videos"
ON public.videos
FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Step 4: Clean up other table policies that reference profiles.role
-- Update profiles table policies
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update categories policies
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;

-- Step 5: Fix database function security
-- Update functions to use SECURITY DEFINER and proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$function$;

-- Update other security definer functions
CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set created_by on INSERT
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
  END IF;

  -- Set updated_by on both INSERT and UPDATE
  NEW.updated_by := auth.uid();

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_creator_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.creator_id := auth.uid();
  RETURN NEW;
END;
$function$;

-- Step 6: Remove the old set_user_role function that used profiles.role
DROP FUNCTION IF EXISTS public.set_user_role(uuid, text);

-- Step 7: Remove the old promote_to_admin function that used profiles.role
DROP FUNCTION IF EXISTS public.promote_to_admin(text);