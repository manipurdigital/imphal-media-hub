-- Create user_sessions table for device tracking
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_info JSONB NOT NULL DEFAULT '{}',
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admin policy for session management
CREATE POLICY "Admins can manage all sessions" 
ON public.user_sessions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_device_id ON public.user_sessions(device_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Deactivate expired sessions
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Delete old inactive sessions (older than 30 days)
  DELETE FROM user_sessions 
  WHERE is_active = false 
  AND created_at < (now() - INTERVAL '30 days');
  
  RETURN expired_count;
END;
$$;

-- Create function to terminate other sessions for a user
CREATE OR REPLACE FUNCTION public.terminate_other_sessions(
  _user_id UUID,
  _current_session_token TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  terminated_count INTEGER;
BEGIN
  -- Deactivate all other active sessions for the user
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = _user_id 
  AND session_token != _current_session_token 
  AND is_active = true;
  
  GET DIAGNOSTICS terminated_count = ROW_COUNT;
  
  RETURN terminated_count;
END;
$$;

-- Create function to update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$;

-- Create trigger for updating last_activity
CREATE TRIGGER update_session_activity_trigger
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_session_activity();