-- Create billing cycle enum
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'yearly', 'one-time');

-- Create feature type enum  
CREATE TYPE public.feature_type AS ENUM ('boolean', 'number', 'text');

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plan_features table
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  feature_type feature_type NOT NULL DEFAULT 'boolean',
  unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create plan_feature_assignments table
CREATE TABLE public.plan_feature_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.plan_features(id) ON DELETE CASCADE,
  feature_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_feature_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_plans
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Subscription plans are viewable by everyone" ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Create policies for plan_features
CREATE POLICY "Admins can manage plan features" ON public.plan_features
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Plan features are viewable by everyone" ON public.plan_features
  FOR SELECT
  USING (true);

-- Create policies for plan_feature_assignments
CREATE POLICY "Admins can manage plan feature assignments" ON public.plan_feature_assignments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Plan feature assignments are viewable by everyone" ON public.plan_feature_assignments
  FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_featured ON public.subscription_plans(is_featured);
CREATE INDEX idx_subscription_plans_display_order ON public.subscription_plans(display_order);
CREATE INDEX idx_plan_features_active ON public.plan_features(is_active);
CREATE INDEX idx_plan_features_display_order ON public.plan_features(display_order);
CREATE INDEX idx_plan_feature_assignments_plan_id ON public.plan_feature_assignments(plan_id);
CREATE INDEX idx_plan_feature_assignments_feature_id ON public.plan_feature_assignments(feature_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_features_updated_at
  BEFORE UPDATE ON public.plan_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_feature_assignments_updated_at
  BEFORE UPDATE ON public.plan_feature_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();