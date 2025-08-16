-- Fix function search_path and create missing profiles + trigger for admin users list

-- 1) Replace get_all_users_for_admin with proper search_path
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
SET search_path TO 'public'
AS $$
BEGIN
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

-- 2) Fix handle_new_user to use full_name column (display_name doesn't exist) and set search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','User'), 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- 3) Ensure trigger exists on auth.users to populate profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- 4) Backfill profiles for existing users without a profile
INSERT INTO public.profiles (user_id, full_name, role)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), 'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;