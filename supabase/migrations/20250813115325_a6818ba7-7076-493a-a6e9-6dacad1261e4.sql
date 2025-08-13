-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins have full access to user_roles" ON user_roles;

-- Create a security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.check_user_role_secure(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admins can manage all user roles" 
ON user_roles 
FOR ALL
USING (check_user_role_secure(auth.uid(), 'admin'::app_role))
WITH CHECK (check_user_role_secure(auth.uid(), 'admin'::app_role));

-- Users can still view their own roles
-- (keeping the existing policy that works)

-- Users can still manage their own roles
-- (keeping the existing policy that works)