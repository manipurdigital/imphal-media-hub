CREATE OR REPLACE FUNCTION public.promote_to_admin(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  -- Update profile role
  UPDATE public.profiles
  SET role = 'admin'
  WHERE user_id = target_id;

  -- Ensure admin role exists in user_roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = target_id AND role = 'admin'::app_role
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_id, 'admin'::app_role);
  END IF;
END;
$function$;