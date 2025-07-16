import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const allCollections = data || [];
      setCollections(allCollections);
      setFeaturedCollections(allCollections.filter(c => c.is_featured));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return { 
    collections, 
    featuredCollections, 
    loading, 
    error, 
    refetch: fetchCollections 
  };
};