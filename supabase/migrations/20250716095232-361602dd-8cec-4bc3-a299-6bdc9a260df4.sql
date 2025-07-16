-- Create settings table for admin panel configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies - only admins can manage settings
CREATE POLICY "Admins can manage settings" 
ON public.settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('platform_name', '"KANGLEIPAK"', 'Platform name displayed in the application'),
('platform_description', '"Premium OTT Streaming Platform"', 'Platform description'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('require_verification', 'true', 'Require email verification for new users'),
('two_factor', 'false', 'Enable two-factor authentication'),
('password_strength', 'true', 'Require strong passwords'),
('email_notifications', 'true', 'Enable email notifications'),
('new_user_alerts', 'true', 'Alert admins about new user registrations'),
('content_alerts', 'false', 'Alert admins about content uploads');