-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscribers
    WHERE user_id = _user_id
    AND subscription_status = 'active'
    AND current_period_end > now()
  )
$$;

-- Update RLS policies for videos table to handle subscription-based access
DROP POLICY IF EXISTS "Public can read published videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view published videos" ON public.videos;

-- Policy for non-premium videos: subscribers and guests can view
CREATE POLICY "Non-premium videos viewable by all" 
ON public.videos 
FOR SELECT 
USING (
  content_status = 'published'
  AND is_premium = false
);

-- Policy for premium videos: only subscribers can view (but still need separate PPV purchase to actually play)
CREATE POLICY "Premium videos viewable by subscribers" 
ON public.videos 
FOR SELECT 
USING (
  content_status = 'published'
  AND is_premium = true
  AND has_active_subscription(auth.uid())
);

-- Keep admin access policy
CREATE POLICY "Admins can view all videos" 
ON public.videos 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update pay_per_view_content policies to ensure only subscribers can see premium PPV content
DROP POLICY IF EXISTS "Anyone can view active pay-per-view content" ON public.pay_per_view_content;

CREATE POLICY "Subscribers can view pay-per-view content" 
ON public.pay_per_view_content 
FOR SELECT 
USING (
  is_active = true
  AND (
    has_active_subscription(auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);