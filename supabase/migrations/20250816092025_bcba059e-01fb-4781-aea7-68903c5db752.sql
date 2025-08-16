-- Create function to get all users for admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  role text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  user_roles jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the requesting user is an admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can access all user data';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.role,
    p.created_at,
    p.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('role', ur.role)
      ) FILTER (WHERE ur.role IS NOT NULL),
      '[]'::jsonb
    ) as user_roles
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id
  GROUP BY p.id, p.user_id, p.username, p.full_name, p.avatar_url, p.role, p.created_at, p.updated_at
  ORDER BY p.created_at DESC;
END;
$$;