-- Create subscribers table to track user subscriptions
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscription_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add razorpay_plan_id to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN razorpay_plan_id TEXT;

-- Enable RLS on subscribers table
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.subscribers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_subscription_plan_id ON public.subscribers(subscription_plan_id);
CREATE INDEX idx_subscribers_razorpay_customer_id ON public.subscribers(razorpay_customer_id);
CREATE INDEX idx_subscribers_razorpay_subscription_id ON public.subscribers(razorpay_subscription_id);