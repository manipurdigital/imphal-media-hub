-- Ensure promote_to_admin also updates user_roles and then promote the requested user
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  -- Update profile role for compatibility with any legacy checks
  UPDATE public.profiles
  SET role = 'admin'
  WHERE user_id = target_id;

  -- Ensure user_roles contains admin (used by RLS policies and has_role())
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_id AND role = 'admin'::app_role
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'admin'::app_role);
  END IF;
END;
$function$;

-- Promote the specified user now
SELECT public.promote_to_admin('manipurdigital2025@gmail.com');