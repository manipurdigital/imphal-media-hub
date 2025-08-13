import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching user role for:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      console.log('User role query result:', { data, error });
      
      if (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
      
      const role = data?.role || 'user';
      console.log('Final role:', role);
      return role;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });
};