-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
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
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles trigger to also create user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Add admin policies to existing tables for admin management
CREATE POLICY "Admins can manage videos"
ON public.videos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage collections"
ON public.collections
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tags"
ON public.tags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage video relationships"
ON public.video_categories
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage video collections"
ON public.video_collections
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage video tags"
ON public.video_tags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));