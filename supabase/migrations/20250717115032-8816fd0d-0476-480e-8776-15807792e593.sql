-- Create viewing_history table to track user watch history
CREATE TABLE public.viewing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  watch_duration INTEGER DEFAULT 0, -- in seconds
  total_duration INTEGER DEFAULT 0, -- total video duration in seconds
  watch_percentage DECIMAL(5,2) DEFAULT 0, -- percentage watched
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create search_history table to track user searches
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  clicked_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_preferences table for recommendation personalization
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_genres TEXT[] DEFAULT '{}',
  preferred_languages TEXT[] DEFAULT '{}',
  content_rating_preference TEXT,
  recommendation_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.viewing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for viewing_history
CREATE POLICY "Users can view their own viewing history" ON public.viewing_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own viewing history" ON public.viewing_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own viewing history" ON public.viewing_history
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all viewing history" ON public.viewing_history
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for search_history
CREATE POLICY "Users can view their own search history" ON public.search_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON public.search_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all search history" ON public.search_history
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user preferences" ON public.user_preferences
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_viewing_history_user_id ON public.viewing_history(user_id);
CREATE INDEX idx_viewing_history_video_id ON public.viewing_history(video_id);
CREATE INDEX idx_viewing_history_last_watched ON public.viewing_history(last_watched_at DESC);

CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_viewing_history_updated_at
BEFORE UPDATE ON public.viewing_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();